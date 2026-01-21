import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = require("https://esm.sh/stripe@14.13.0");

/**
 * Check if a webhook event has already been processed (deduplication)
 * Returns true if already processed, false if new
 */
async function isEventProcessed(supabase: any, eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("processed_webhook_events")
    .select("event_id")
    .eq("event_id", eventId)
    .single();

  return !!data;
}

/**
 * Mark a webhook event as processed
 */
async function markEventProcessed(supabase: any, eventId: string, eventType: string): Promise<void> {
  await supabase
    .from("processed_webhook_events")
    .insert({ event_id: eventId, event_type: eventType })
    .onConflict("event_id")
    .ignore();
}

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

    // Deduplication: Skip already-processed events
    const alreadyProcessed = await isEventProcessed(supabase, event.id);
    if (alreadyProcessed) {
      console.log(`Skipping duplicate webhook event: ${event.id}`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle events
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        await handlePaymentSucceeded(supabase, invoice);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        // Only handle one-time payments (not subscription invoices)
        if (paymentIntent.metadata?.billing_type === "one_time") {
          await handleOneTimePaymentSucceeded(supabase, paymentIntent);
        }
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

    // Mark event as processed to prevent duplicate handling
    await markEventProcessed(supabase, event.id, event.type);

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

  const stripe_instance = require("https://esm.sh/stripe@14.13.0");
  const stripeClient = new stripe_instance.Stripe(
    Deno.env.get("STRIPE_SECRET_KEY") || ""
  );

  const stripeSubscription = await stripeClient.subscriptions.retrieve(subscriptionId);
  const priceId = stripeSubscription.items.data[0].price.id;

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  let userId = existingSub?.user_id;
  if (!userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile?.user_id) return;
    userId = profile.user_id;
  }

  // Get plan with plan_id
  const { data: plan } = await supabase
    .from("plans")
    .select("plan_id, passes_per_period")
    .eq("stripe_price_id", priceId)
    .single();

  if (!plan) return;

  // Upsert subscription with plan_id and billing_type
  await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: stripeSubscription.status,
        current_period_end: new Date(
          stripeSubscription.current_period_end * 1000
        ).toISOString(),
        plan_id: plan.plan_id,
        billing_type: "subscription",
      },
      { onConflict: "user_id" }
    );

  const periodStart = new Date(stripeSubscription.current_period_start * 1000);
  const periodEnd = new Date(stripeSubscription.current_period_end * 1000);

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

async function handleOneTimePaymentSucceeded(supabase: any, paymentIntent: any) {
  const customerId = paymentIntent.customer;
  const metadata = paymentIntent.metadata;

  if (!metadata?.user_id || !metadata?.plan_id) {
    console.error("Missing metadata in one-time payment:", paymentIntent.id);
    return;
  }

  const userId = metadata.user_id;
  const planId = metadata.plan_id;
  const passesPerPeriod = parseInt(metadata.passes_per_period || "0", 10);

  // Get user profile to verify
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile || profile.user_id !== userId) {
    console.error("User mismatch in one-time payment:", paymentIntent.id);
    return;
  }

  // Calculate 30-day window for one-time purchase
  const now = new Date();
  const purchaseDate = now.toISOString();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const periodEnd = expiresAt;

  // Create subscription record for one-time purchase
  await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: null, // No recurring subscription
        status: "active",
        current_period_end: periodEnd,
        plan_id: planId,
        billing_type: "one_time",
        purchase_date: purchaseDate,
        expires_at: expiresAt,
      },
      { onConflict: "user_id" }
    );

  // Create pass_balance for the 30-day window
  await supabase
    .from("pass_balances")
    .upsert(
      {
        user_id: userId,
        period_start: purchaseDate,
        period_end: periodEnd,
        passes_allowed: passesPerPeriod,
        passes_used: 0,
      },
      { onConflict: "user_id" }
    );

  console.log(`One-time purchase processed for user ${userId}: ${passesPerPeriod} passes, expires ${expiresAt}`);
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("user_id, plan_id, billing_type")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  let userId = existingSub?.user_id;
  let planId = existingSub?.plan_id;
  let billingType = existingSub?.billing_type || "subscription";

  if (!userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("stripe_customer_id", subscription.customer)
      .single();

    if (!profile?.user_id) return;
    userId = profile.user_id;

    // Try to get plan_id from the subscription's price
    const priceId = subscription.items?.data?.[0]?.price?.id;
    if (priceId) {
      const { data: plan } = await supabase
        .from("plans")
        .select("plan_id")
        .eq("stripe_price_id", priceId)
        .single();
      if (plan) planId = plan.plan_id;
    }
  }

  await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        plan_id: planId,
        billing_type: billingType,
      },
      { onConflict: "user_id" }
    );
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("user_id, plan_id, billing_type")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  let userId = existingSub?.user_id;
  let planId = existingSub?.plan_id;
  let billingType = existingSub?.billing_type || "subscription";

  if (!userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("stripe_customer_id", subscription.customer)
      .single();

    if (!profile?.user_id) return;
    userId = profile.user_id;
  }

  await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        status: "canceled",
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        plan_id: planId,
        billing_type: billingType,
      },
      { onConflict: "user_id" }
    );
}
