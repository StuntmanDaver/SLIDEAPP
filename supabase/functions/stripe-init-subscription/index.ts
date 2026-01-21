import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

const stripe = require("https://esm.sh/stripe@14.13.0");

async function buildIdempotencyKey(userId: string, planId: string) {
  const raw = `${userId}:${planId}:${new Date().toISOString()}`;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // Initialize Supabase
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Parse request body
    const body = await parseJsonBody(req);
    if (!body || !body.plan_id) {
      return errorResponse("Missing plan_id", 400);
    }

    // Extract device info for binding
    const deviceId = body.device_id;
    const deviceName = body.device_name;
    const platform = body.platform;

    // Check and bind device if device info is provided
    if (deviceId) {
      const bindingResult = await checkAndBindDevice(
        supabase,
        user.user_id,
        deviceId,
        deviceName,
        platform
      );

      if (!bindingResult.success) {
        return errorResponse(bindingResult.message, 403);
      }
    }

    // Get plan with billing_type and price_cents
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("plan_id, stripe_price_id, billing_type, price_cents, passes_per_period")
      .eq("plan_id", body.plan_id)
      .single();

    if (planError || !plan) {
      return errorResponse("Plan not found", 404);
    }

    const idempotencyKey = await buildIdempotencyKey(user.user_id, plan.plan_id);

    // Initialize Stripe client
    const stripeClient = new stripe.Stripe(
      Deno.env.get("STRIPE_SECRET_KEY") || ""
    );

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, display_name")
      .eq("user_id", user.user_id)
      .single();

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
    } else {
      const customer = await stripeClient.customers.create(
        {
          email: user.user_id,
          name: profile?.display_name || "Slide User",
          metadata: {
            user_id: user.user_id,
          },
        },
        { idempotencyKey: `${idempotencyKey}:customer` }
      );

      stripeCustomerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("user_id", user.user_id);
    }

    // Create ephemeral key (needed for both billing types)
    const ephemeralKey = await stripeClient.ephemeralKeys.create(
      { customer: stripeCustomerId },
      { apiVersion: "2024-04-10" }
    );

    // Branch by billing type
    if (plan.billing_type === "subscription") {
      // Existing subscription flow
      const subscription = await stripeClient.subscriptions.create(
        {
          customer: stripeCustomerId,
          items: [
            {
              price: plan.stripe_price_id,
            },
          ],
          payment_behavior: "default_incomplete",
          expand: ["latest_invoice.payment_intent"],
          metadata: {
            user_id: user.user_id,
            plan_id: plan.plan_id,
            billing_type: "subscription",
          },
        },
        { idempotencyKey: `${idempotencyKey}:subscription` }
      );

      return successResponse({
        customerId: stripeCustomerId,
        ephemeralKey: ephemeralKey.secret,
        paymentIntent: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        billingType: "subscription",
      });
    } else {
      // One-time payment flow - create PaymentIntent directly
      const paymentIntent = await stripeClient.paymentIntents.create(
        {
          amount: plan.price_cents,
          currency: "usd",
          customer: stripeCustomerId,
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            user_id: user.user_id,
            plan_id: plan.plan_id,
            billing_type: "one_time",
            passes_per_period: plan.passes_per_period.toString(),
          },
        },
        { idempotencyKey: `${idempotencyKey}:payment_intent` }
      );

      return successResponse({
        customerId: stripeCustomerId,
        ephemeralKey: ephemeralKey.secret,
        paymentIntent: paymentIntent.client_secret,
        billingType: "one_time",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});

/**
 * Check if device is already bound to another user, and bind if not
 */
async function checkAndBindDevice(
  supabase: any,
  userId: string,
  deviceId: string,
  deviceName?: string,
  platform?: string
): Promise<{ success: boolean; message: string }> {
  // Check if this device is already bound to any user
  const { data: existingBinding } = await supabase
    .from("device_bindings")
    .select("user_id, device_name")
    .eq("device_id", deviceId)
    .single();

  if (existingBinding) {
    // Device is already bound
    if (existingBinding.user_id === userId) {
      // Same user - update last_active_at
      await supabase
        .from("device_bindings")
        .update({ last_active_at: new Date().toISOString() })
        .eq("user_id", userId);
      return { success: true, message: "Device already bound to this user" };
    } else {
      // Different user - block
      return {
        success: false,
        message: "This device is already bound to another account",
      };
    }
  }

  // Check if user already has a device bound
  const { data: userBinding } = await supabase
    .from("device_bindings")
    .select("device_id, device_name")
    .eq("user_id", userId)
    .single();

  if (userBinding) {
    // User already has a different device bound - block
    return {
      success: false,
      message: `Your account is already bound to device: ${userBinding.device_name || "Unknown Device"}`,
    };
  }

  // No existing binding - create new one
  const { error } = await supabase.from("device_bindings").insert({
    user_id: userId,
    device_id: deviceId,
    device_name: deviceName || null,
    platform: platform || null,
  });

  if (error) {
    console.error("Device binding error:", error);
    return { success: false, message: "Failed to bind device" };
  }

  return { success: true, message: "Device bound successfully" };
}
