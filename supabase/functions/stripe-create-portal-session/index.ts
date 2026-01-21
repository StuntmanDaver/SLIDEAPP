import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse } from "../_shared/auth.ts";

const stripe = require("https://esm.sh/stripe@14.13.0");
// Return URL after portal session - uses app deep link for mobile, falls back to web
const RETURN_URL = Deno.env.get("PORTAL_RETURN_URL") || "slide://account";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  try {
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, display_name")
      .eq("user_id", user.user_id)
      .single();

    const stripeClient = new stripe.Stripe(
      Deno.env.get("STRIPE_SECRET_KEY") || ""
    );

    let stripeCustomerId = profile?.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripeClient.customers.create({
        name: profile?.display_name || "Slide User",
        metadata: {
          user_id: user.user_id,
        },
      });

      stripeCustomerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("user_id", user.user_id);
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: RETURN_URL,
    });

    return successResponse({ url: session.url });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
