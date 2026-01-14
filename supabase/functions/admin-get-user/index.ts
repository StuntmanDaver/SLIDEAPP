import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, requireRole, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
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
    const adminUser = await getAuthenticatedUser(req, supabase);
    if (!adminUser) return errorResponse("Unauthorized", 401);

    const isAdmin = await requireRole(adminUser.user_id, "admin", supabase);
    if (!isAdmin) return errorResponse("Forbidden", 403);

    const body = await parseJsonBody(req);
    const { user_id } = body || {};

    if (!user_id) return errorResponse("User ID is required", 400);

    // Fetch user from auth.users
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(user_id);
    if (authError || !user) return errorResponse("User not found", 404);

    // Fetch related data
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user_id).single();
    const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", user_id).single();
    const { data: balance } = await supabase.from("pass_balances").select("*").eq("user_id", user_id).single();
    const { data: passes } = await supabase.from("passes").select("*").eq("owner_user_id", user_id).order("created_at", { ascending: false });

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        banned_until: user.banned_until,
        profile,
        subscription,
        balance,
        passes,
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
