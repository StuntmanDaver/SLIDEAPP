import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";
import { checkRateLimit, RATE_LIMIT_CONFIGS, rateLimitErrorResponse } from "../_shared/rate-limit.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const rateLimit = checkRateLimit(`surge-claim:${user.user_id}`, RATE_LIMIT_CONFIGS.surgeClaim);
    if (!rateLimit.allowed) {
      return rateLimitErrorResponse(rateLimit.resetAt);
    }

    // Parse request body
    const body = await parseJsonBody(req);
    if (!body || !body.surge_id) {
      return errorResponse("Missing surge_id", 400);
    }

    const { surge_id } = body;

    // Call the atomic claim function
    const { data, error } = await supabase.rpc("claim_surge_spot", {
      p_surge_id: surge_id,
      p_user_id: user.user_id,
    });

    if (error) {
      console.error("Error claiming surge spot:", error);
      return errorResponse("Failed to claim surge spot", 500);
    }

    // The function returns an array with one row
    const result = data?.[0];
    if (!result) {
      return errorResponse("Failed to claim surge spot", 500);
    }

    if (!result.success) {
      return errorResponse(result.error_message || "Failed to claim spot", 400);
    }

    // Get surge details for the response
    const { data: surge } = await supabase
      .from("surge_events")
      .select("title, message, max_claims, claims_count, expires_at")
      .eq("surge_id", surge_id)
      .single();

    return successResponse({
      success: true,
      position: result.queue_position,
      surge_id,
      title: surge?.title,
      max_claims: surge?.max_claims,
      claims_count: surge?.claims_count,
      expires_at: surge?.expires_at,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
