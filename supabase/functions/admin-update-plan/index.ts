import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, requireRole, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  try {
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) return errorResponse("Unauthorized", 401);

    const isAdmin = await requireRole(user.user_id, "admin", supabase);
    if (!isAdmin) return errorResponse("Forbidden", 403);

    const body = await parseJsonBody(req);
    const { plan_id, is_active, passes_per_period } = body || {};

    if (!plan_id) return errorResponse("Missing plan_id", 400);

    const updates: any = {};
    if (typeof is_active !== 'undefined') updates.is_active = is_active;
    if (typeof passes_per_period !== 'undefined') updates.passes_per_period = passes_per_period;

    if (Object.keys(updates).length === 0) {
      return errorResponse("No updates provided", 400);
    }

    const { data: plan, error } = await supabase
      .from("plans")
      .update(updates)
      .eq("plan_id", plan_id)
      .select()
      .single();

    if (error) throw error;

    return successResponse({ plan });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
