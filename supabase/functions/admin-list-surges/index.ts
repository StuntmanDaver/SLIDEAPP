import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, getStaffRole, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

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

    // Verify admin role
    const role = await getStaffRole(user.user_id, supabase);
    if (!role || role !== "admin") {
      return errorResponse("Forbidden: Admin role required", 403);
    }

    // Parse request body
    const body = await parseJsonBody(req) || {};
    const limit = parseInt(body.limit) || 50;
    const offset = parseInt(body.offset) || 0;
    const activeOnly = body.active_only === true;

    // Build query
    let query = supabase
      .from("surge_events")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (activeOnly) {
      query = query.eq("is_active", true).gt("expires_at", new Date().toISOString());
    }

    const { data: surges, count, error } = await query;

    if (error) {
      console.error("Error fetching surges:", error);
      return errorResponse("Failed to fetch surges", 500);
    }

    // Get stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: activeSurges } = await supabase
      .from("surge_events")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString());

    const { count: surgesToday } = await supabase
      .from("surge_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    const { count: claimsToday } = await supabase
      .from("surge_claims")
      .select("*", { count: "exact", head: true })
      .gte("claimed_at", today.toISOString());

    const { count: pushTokens } = await supabase
      .from("push_tokens")
      .select("*", { count: "exact", head: true });

    // Get surge config
    const { data: config } = await supabase
      .from("surge_config")
      .select("*")
      .eq("config_id", "default")
      .single();

    return successResponse({
      surges: surges || [],
      total: count || 0,
      stats: {
        active_surges: activeSurges || 0,
        total_surges_today: surgesToday || 0,
        total_claims_today: claimsToday || 0,
        registered_push_tokens: pushTokens || 0,
      },
      config,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
