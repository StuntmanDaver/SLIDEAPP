// This test assumes a running Supabase instance and Edge Functions
// Run with: deno test --allow-net --allow-env tests/integration/pass-lifecycle.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") || "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

console.log("DEBUG: SUPABASE_URL:", SUPABASE_URL);
console.log("DEBUG: SUPABASE_ANON_KEY length:", SUPABASE_ANON_KEY.length);
console.log("DEBUG: SERVICE_ROLE_KEY length:", SERVICE_ROLE_KEY.length);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Helper to create a user with subscription
async function createTestUser() {
  const email = `test_${Date.now()}@example.com`;
  const password = "password123";
  const { data: { user }, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error) throw error;
  if (!user) throw new Error("User creation failed");

  // Create active subscription
  const { error: subError } = await adminSupabase.from("subscriptions").insert({
    user_id: user.id,
    status: "active",
    stripe_customer_id: `cus_test_${Date.now()}`,
    stripe_subscription_id: `sub_test_${Date.now()}`,
    current_period_end: new Date(Date.now() + 86400000).toISOString()
  });
  if (subError) throw subError;

  // Create pass_balances
  const { error: balanceError } = await adminSupabase.from("pass_balances").insert({
    user_id: user.id,
    period_start: new Date().toISOString(),
    period_end: new Date(Date.now() + 86400000).toISOString(),
    passes_allowed: 5,
    passes_used: 0
  });
  if (balanceError) throw balanceError;

  // Sign in to get session
  const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  if (!session) throw new Error("Sign in failed: no session returned");
  
  return { user, session };
}

async function createStaffUser() {
  const email = `staff_${Date.now()}@example.com`;
  const password = "password123";
  const { data: { user }, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error) throw error;

  await adminSupabase.from("staff_users").insert({
    user_id: user!.id,
    role: "scanner",
    is_active: true
  });

  const { data: { session } } = await supabase.auth.signInWithPassword({ email, password });
  return { user: user!, session };
}

Deno.test({
  name: "Pass Lifecycle: Create -> Claim -> Issue QR -> Redeem",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const { session: userSession } = await createTestUser();
    const { session: staffSession } = await createStaffUser();

    // 1. Create Pass
    const createRes = await fetch(`${SUPABASE_URL}/functions/v1/create-pass`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userSession!.access_token}`,
        "Content-Type": "application/json"
      }
    });
    const createData = await createRes.json();
    assertEquals(createRes.status, 200);
    assertExists(createData.pass_id);
    
    // Extract token from link
    const token = createData.claim_link.split("token=")[1];
    assertExists(token);

    // 2. Claim Pass
    const claimRes = await fetch(`${SUPABASE_URL}/functions/v1/claim-pass`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userSession!.access_token}`, // Claiming for self
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });
    const claimData = await claimRes.json();
    assertEquals(claimRes.status, 200);
    assertEquals(claimData.pass_id, createData.pass_id);

    // 3. Issue QR Token
    const qrRes = await fetch(`${SUPABASE_URL}/functions/v1/issue-qr-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userSession!.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pass_id: createData.pass_id })
    });
    const qrData = await qrRes.json();
    assertEquals(qrRes.status, 200);
    assertExists(qrData.qr_token);

    // 4. Redeem Pass
    const redeemRes = await fetch(`${SUPABASE_URL}/functions/v1/redeem-pass`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffSession!.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        qr_token: qrData.qr_token,
        device_id: "test-device" 
      })
    });
    const redeemData = await redeemRes.json();
    assertEquals(redeemRes.status, 200);
    assertEquals(redeemData.result, "VALID");

    // 5. Verify Double Redeem
    const redeemRes2 = await fetch(`${SUPABASE_URL}/functions/v1/redeem-pass`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffSession!.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        qr_token: qrData.qr_token,
        device_id: "test-device" 
      })
    });
    const redeemData2 = await redeemRes2.json();
    assertEquals(redeemData2.result, "USED");
  }
});
