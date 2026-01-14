import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = require("https://esm.sh/stripe@14.13.0");

serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Initialize Supabase with service role (webhook events)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  const stripeClient = new stripe.Stripe(
    Deno.env.get("STRIPE_SECRET_KEY") || ""
  );

  try {
    // Verify Stripe signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature", { status: 403 });
    }

    const rawBody = await req.text();
    const event = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    // Handle events
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await handlePaymentSucceeded(supabase, invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;

  // Find user by Stripe subscription ID
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!subscription) return;

  const userId = subscription.user_id;

  // Get plan from Stripe subscription
  const stripe_instance = require("https://esm.sh/stripe@14.13.0");
  const stripeClient = new stripe_instance.Stripe(
    Deno.env.get("STRIPE_SECRET_KEY") || ""
  );

  const stripeSubscription = await stripeClient.subscriptions.retrieve(subscriptionId);
  const priceId = stripeSubscription.items.data[0].price.id;

  // Get plan passes per period
  const { data: plan } = await supabase
    .from("plans")
    .select("passes_per_period")
    .eq("stripe_price_id", priceId)
    .single();

  if (!plan) return;

  // Calculate current period
  const currentDate = new Date();
  const periodStart = new Date(stripeSubscription.current_period_start * 1000);
  const periodEnd = new Date(stripeSubscription.current_period_end * 1000);

  // Reset pass balance
  await supabase
    .from("pass_balances")
    .upsert(
      {
        user_id: userId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        passes_allowed: plan.passes_per_period,
        passes_used: 0,
      },
      { onConflict: "user_id" }
    );
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  // Find user and update subscription status
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!sub) return;

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq("user_id", sub.user_id);
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  // Mark subscription as canceled
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!sub) return;

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
    })
    .eq("user_id", sub.user_id);
}
