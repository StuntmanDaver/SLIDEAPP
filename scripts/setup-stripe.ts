#!/usr/bin/env npx ts-node
/**
 * Stripe Setup Script
 * 
 * This script configures Stripe for the Slide app:
 * 1. Creates Products for each membership tier (Basic, Plus, Premium)
 * 2. Creates Prices (monthly subscriptions and one-time purchases)
 * 3. Configures the Customer Portal to allow subscription management
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_xxx npx ts-node scripts/setup-stripe.ts
 * 
 * Or set STRIPE_SECRET_KEY in your .env file and run:
 *   npx ts-node scripts/setup-stripe.ts
 */

import Stripe from 'stripe';

// Load environment variables if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not required
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required');
  console.error('Usage: STRIPE_SECRET_KEY=sk_test_xxx npx ts-node scripts/setup-stripe.ts');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Plan configuration matching the database schema
const PLANS = [
  {
    tier: 'basic',
    name: 'Slide Basic',
    description: 'Perfect for occasional nights out - 3 passes per month',
    passes: 3,
    monthlyPriceCents: 2000,  // $20
    onetimePriceCents: 2000,  // $20
  },
  {
    tier: 'plus',
    name: 'Slide Plus',
    description: 'Our most popular plan - 6 passes per month',
    passes: 6,
    monthlyPriceCents: 5000,  // $50
    onetimePriceCents: 5000,  // $50
  },
  {
    tier: 'premium',
    name: 'Slide Premium',
    description: 'For the ultimate nightlife experience - 9 passes per month',
    passes: 9,
    monthlyPriceCents: 8000,  // $80
    onetimePriceCents: 8000,  // $80
  },
];

interface CreatedPrices {
  [key: string]: {
    productId: string;
    monthlyPriceId: string;
    onetimePriceId: string;
  };
}

async function createProducts(): Promise<CreatedPrices> {
  console.log('\n📦 Creating Stripe Products and Prices...\n');
  
  const createdPrices: CreatedPrices = {};

  for (const plan of PLANS) {
    console.log(`Creating ${plan.name}...`);

    // Create the product
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        tier: plan.tier,
        passes_per_period: plan.passes.toString(),
        app: 'slide',
      },
    });

    console.log(`  ✓ Product created: ${product.id}`);

    // Create monthly subscription price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPriceCents,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier: plan.tier,
        billing_type: 'subscription',
        passes_per_period: plan.passes.toString(),
      },
      lookup_key: `price_${plan.tier}_monthly`,
    });

    console.log(`  ✓ Monthly price created: ${monthlyPrice.id}`);

    // Create one-time price
    const onetimePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.onetimePriceCents,
      currency: 'usd',
      metadata: {
        tier: plan.tier,
        billing_type: 'one_time',
        passes_per_period: plan.passes.toString(),
      },
      lookup_key: `price_${plan.tier}_onetime`,
    });

    console.log(`  ✓ One-time price created: ${onetimePrice.id}`);

    createdPrices[plan.tier] = {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      onetimePriceId: onetimePrice.id,
    };
  }

  return createdPrices;
}

async function configureCustomerPortal(productPriceMap: {productId: string, priceIds: string[]}[]): Promise<void> {
  console.log('\n⚙️  Configuring Customer Portal...\n');

  try {
    // Build products config for subscription updates
    const productsConfig = productPriceMap.length > 0 
      ? productPriceMap.map(p => ({
          product: p.productId,
          prices: p.priceIds,
        }))
      : undefined;

    // Create a portal configuration
    const portalConfig = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Slide - Manage Your Membership',
        privacy_policy_url: 'https://slidenightlife.com/privacy',
        terms_of_service_url: 'https://slidenightlife.com/terms',
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'name', 'phone', 'address'],
        },
        invoice_history: {
          enabled: true,
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          proration_behavior: 'none',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other',
            ],
          },
        },
        subscription_pause: {
          enabled: false,
        },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          proration_behavior: 'create_prorations',
          products: productsConfig,
        },
      },
      default_return_url: 'slide://account',
    });

    console.log(`  ✓ Portal configuration created: ${portalConfig.id}`);
    console.log(`  ✓ Portal is now the default configuration`);

  } catch (error: any) {
    if (error.code === 'resource_already_exists') {
      console.log('  ℹ️  Portal configuration already exists, updating...');
      
      // List existing configurations
      const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
      if (configs.data.length > 0) {
        const existingConfig = configs.data[0];
        
        await stripe.billingPortal.configurations.update(existingConfig.id, {
          business_profile: {
            headline: 'Slide - Manage Your Membership',
            privacy_policy_url: 'https://slidenightlife.com/privacy',
            terms_of_service_url: 'https://slidenightlife.com/terms',
          },
          features: {
            customer_update: {
              enabled: true,
              allowed_updates: ['email', 'name', 'phone', 'address'],
            },
            invoice_history: {
              enabled: true,
            },
            payment_method_update: {
              enabled: true,
            },
            subscription_cancel: {
              enabled: true,
              mode: 'at_period_end',
              cancellation_reason: {
                enabled: true,
                options: [
                  'too_expensive',
                  'missing_features',
                  'switched_service',
                  'unused',
                  'other',
                ],
              },
            },
          },
          default_return_url: 'slide://account',
        });
        
        console.log(`  ✓ Portal configuration updated: ${existingConfig.id}`);
      }
    } else {
      throw error;
    }
  }
}

async function generateDatabaseUpdateSQL(createdPrices: CreatedPrices): Promise<void> {
  console.log('\n📝 Database Update SQL:\n');
  console.log('Run this SQL in your Supabase dashboard to update price IDs:\n');
  console.log('```sql');
  console.log('-- Update plans with real Stripe price IDs');
  
  for (const [tier, prices] of Object.entries(createdPrices)) {
    const tierCapitalized = tier.charAt(0).toUpperCase() + tier.slice(1);
    
    console.log(`UPDATE plans SET stripe_price_id = '${prices.monthlyPriceId}' WHERE name = '${tierCapitalized} Monthly';`);
    console.log(`UPDATE plans SET stripe_price_id = '${prices.onetimePriceId}' WHERE name = '${tierCapitalized} One-Time';`);
  }
  
  console.log('```\n');
}

async function main(): Promise<void> {
  console.log('🚀 Stripe Setup for Slide App');
  console.log('================================');

  try {
    // Verify Stripe connection
    const account = await stripe.accounts.retrieve();
    console.log(`\n✓ Connected to Stripe account: ${account.settings?.dashboard?.display_name || account.id}`);
    console.log(`  Mode: ${STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 'TEST'}`);

    // Check for existing products
    const existingProducts = await stripe.products.list({
      limit: 100,
    });
    
    const slideProducts = existingProducts.data.filter(p => 
      p.metadata?.app === 'slide' || p.name?.includes('Slide')
    );

    if (slideProducts.length > 0) {
      console.log(`\n⚠️  Found ${slideProducts.length} existing Slide products:`);
      for (const product of slideProducts) {
        console.log(`   - ${product.name} (${product.id})`);
      }
      console.log('\nTo avoid duplicates, please review existing products in Stripe Dashboard.');
      console.log('If you want to recreate, archive the existing products first.\n');
      
      // List existing prices for these products
      console.log('Existing prices:');
      for (const product of slideProducts) {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });
        for (const price of prices.data) {
          console.log(`   - ${price.id}: $${(price.unit_amount || 0) / 100} ${price.recurring ? '/' + price.recurring.interval : 'one-time'}`);
        }
      }
      
      console.log('\nSkipping product creation. Configuring portal only...');
      
      // Build product-price map for portal configuration
      const productPriceMap: {productId: string, priceIds: string[]}[] = [];
      for (const product of slideProducts) {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });
        const subscriptionPrices = prices.data.filter(p => p.recurring).map(p => p.id);
        if (subscriptionPrices.length > 0) {
          productPriceMap.push({
            productId: product.id,
            priceIds: subscriptionPrices,
          });
        }
      }
      
      await configureCustomerPortal(productPriceMap);
      
    } else {
      // Create new products and prices
      const createdPrices = await createProducts();
      
      // Build product-price map for portal configuration
      const productPriceMap = Object.values(createdPrices).map(p => ({
        productId: p.productId,
        priceIds: [p.monthlyPriceId], // Only subscription prices for portal
      }));
      
      await configureCustomerPortal(productPriceMap);
      await generateDatabaseUpdateSQL(createdPrices);
    }

    console.log('\n✅ Stripe setup complete!\n');
    console.log('Next steps:');
    console.log('1. Update the plans table in your database with the new Stripe price IDs');
    console.log('2. Set up the webhook endpoint in Stripe Dashboard:');
    console.log('   URL: https://<your-project>.supabase.co/functions/v1/stripe-webhook');
    console.log('   Events: checkout.session.completed, customer.subscription.created,');
    console.log('           customer.subscription.updated, customer.subscription.deleted,');
    console.log('           invoice.payment_succeeded, payment_intent.succeeded');
    console.log('3. Add STRIPE_WEBHOOK_SECRET to your Supabase edge function secrets');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('   Check that your STRIPE_SECRET_KEY is valid');
    }
    process.exit(1);
  }
}

main();
