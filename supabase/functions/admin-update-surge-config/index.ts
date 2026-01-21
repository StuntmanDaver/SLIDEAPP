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
    const body = await parseJsonBody(req);
    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    // Validate fields
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.time_triggers !== undefined) {
      if (!Array.isArray(body.time_triggers)) {
        return errorResponse("time_triggers must be an array", 400);
      }
      updates.time_triggers = body.time_triggers;
    }

    if (body.membership_threshold !== undefined) {
      const val = parseInt(body.membership_threshold);
      if (isNaN(val) || val < 1) {
        return errorResponse("membership_threshold must be a positive integer", 400);
      }
      updates.membership_threshold = val;
    }

    if (body.membership_window_minutes !== undefined) {
      const val = parseInt(body.membership_window_minutes);
      if (isNaN(val) || val < 1) {
        return errorResponse("membership_window_minutes must be a positive integer", 400);
      }
      updates.membership_window_minutes = val;
    }

    if (body.usage_threshold !== undefined) {
      const val = parseInt(body.usage_threshold);
      if (isNaN(val) || val < 1) {
        return errorResponse("usage_threshold must be a positive integer", 400);
      }
      updates.usage_threshold = val;
    }

    if (body.surge_duration_minutes !== undefined) {
      const val = parseInt(body.surge_duration_minutes);
      if (isNaN(val) || val < 1) {
        return errorResponse("surge_duration_minutes must be a positive integer", 400);
      }
      updates.surge_duration_minutes = val;
    }

    if (body.max_claims_per_surge !== undefined) {
      const val = parseInt(body.max_claims_per_surge);
      if (isNaN(val) || val < 1) {
        return errorResponse("max_claims_per_surge must be a positive integer", 400);
      }
      updates.max_claims_per_surge = val;
    }

    // Update config
    const { data: config, error } = await supabase
      .from("surge_config")
      .update(updates)
      .eq("config_id", "default")
      .select()
      .single();

    if (error) {
      console.error("Error updating config:", error);
      return errorResponse("Failed to update config", 500);
    }

    return successResponse({ config });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
