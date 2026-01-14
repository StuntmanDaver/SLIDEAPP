import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

const stripe = require("https://esm.sh/stripe@14.13.0");

serve(async (req: Request) => {
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

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("stripe_price_id")
      .eq("plan_id", body.plan_id)
      .single();

    if (planError || !plan) {
      return errorResponse("Plan not found", 404);
    }

    // Initialize Stripe client
    const stripeClient = new stripe.Stripe(
      Deno.env.get("STRIPE_SECRET_KEY") || ""
    );

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.user_id)
      .single();

    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.user_id)
        .single();

      const customer = await stripeClient.customers.create({
        email: user.user_id, // Use user_id as identifier
        name: profile?.display_name || "Slide User",
        metadata: {
          user_id: user.user_id,
        },
      });

      stripeCustomerId = customer.id;
    }

    // Create Stripe subscription session
    const ephemeralKey = await stripeClient.ephemeralKeys.create(
      {customer: stripeCustomerId},
      {apiVersion: "2024-04-10"}
    );

    const subscription = await stripeClient.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: plan.stripe_price_id,
        },
      ],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    return successResponse({
      customerId: stripeCustomerId,
      ephemeralKey: ephemeralKey.secret,
      paymentIntent: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
