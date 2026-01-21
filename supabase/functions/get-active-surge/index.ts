import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";

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

    // Get active surge that hasn't expired
    const { data: surge, error: surgeError } = await supabase
      .from("surge_events")
      .select("*")
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (surgeError && surgeError.code !== "PGRST116") {
      // PGRST116 is "no rows found" which is expected when no active surge
      console.error("Error fetching surge:", surgeError);
      return errorResponse("Failed to fetch surge", 500);
    }

    if (!surge) {
      return successResponse({ surge: null });
    }

    // Check if user has already claimed this surge
    const { data: claim } = await supabase
      .from("surge_claims")
      .select("claim_id, position, claimed_at")
      .eq("surge_id", surge.surge_id)
      .eq("user_id", user.user_id)
      .single();

    return successResponse({
      surge: {
        surge_id: surge.surge_id,
        title: surge.title,
        message: surge.message,
        max_claims: surge.max_claims,
        claims_count: surge.claims_count,
        spots_remaining: surge.max_claims - surge.claims_count,
        starts_at: surge.starts_at,
        expires_at: surge.expires_at,
        is_full: surge.claims_count >= surge.max_claims,
      },
      user_claim: claim
        ? {
            position: claim.position,
            claimed_at: claim.claimed_at,
          }
        : null,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
