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
    const { limit = 50, filterResult, dateFrom, dateTo } = body || {};

    let query = supabase
      .from("scan_events")
      .select("*")
      .order("ts", { ascending: false })
      .limit(limit);

    if (filterResult) {
      query = query.eq("result", filterResult);
    }

    if (dateFrom) {
      query = query.gte("ts", new Date(dateFrom).toISOString());
    }

    if (dateTo) {
      // Include the entire day
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt("ts", endDate.toISOString());
    }

    const { data: events, error } = await query;

    if (error) throw error;

    return successResponse({ events });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
