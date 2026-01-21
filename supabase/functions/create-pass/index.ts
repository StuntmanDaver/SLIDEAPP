import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse } from "../_shared/auth.ts";
import { generateClaimToken, hashToken } from "../_shared/utils.ts";
import { checkRateLimit, RATE_LIMIT_CONFIGS, rateLimitErrorResponse } from "../_shared/rate-limit.ts";

export const handler = async (req: Request) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

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

    // Rate limit by user
    const rateLimit = checkRateLimit(`create:${user.user_id}`, RATE_LIMIT_CONFIGS.createPass);
    if (!rateLimit.allowed) {
      return rateLimitErrorResponse(rateLimit.resetAt);
    }

    // Check membership is active
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.user_id)
      .single();

    if (!subscription || subscription.status !== "active") {
      return errorResponse("Membership inactive", 400);
    }

    // Check pass balance
    const { data: balance } = await supabase
      .from("pass_balances")
      .select("passes_allowed, passes_used")
      .eq("user_id", user.user_id)
      .single();

    if (!balance || balance.passes_used >= balance.passes_allowed) {
      return errorResponse("No passes remaining", 400);
    }

    // Generate claim token
    const plainToken = generateClaimToken(32);
    const tokenHash = await hashToken(plainToken);

    // Atomically increment passes_used
    const { error: updateError } = await supabase
      .from("pass_balances")
      .update({
        passes_used: balance.passes_used + 1,
      })
      .eq("user_id", user.user_id)
      .eq("passes_used", balance.passes_used);

    if (updateError) {
      return errorResponse("Failed to update pass balance", 500);
    }

    // Create pass
    const { data: pass, error: passError } = await supabase
      .from("passes")
      .insert({
        issuer_user_id: user.user_id,
        claim_token_hash: tokenHash,
        status: "created",
      })
      .select()
      .single();

    if (passError || !pass) {
      return errorResponse("Failed to create pass", 500);
    }

    // Build claim link
    const baseUrl =
      Deno.env.get("UNIVERSAL_LINK_BASE_URL") || 
      Deno.env.get("APP_URL") || 
      "https://yourdomain.com";
    const claimLink = `slide://claim?token=${plainToken}`;
    const fallbackLink = `${baseUrl}/claim?token=${plainToken}`;

    return successResponse({
      pass_id: pass.pass_id,
      claim_link: claimLink,
      fallback_link: fallbackLink,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
};

// Only run server if this is the main module
if (import.meta.main) {
  serve(handler);
}
