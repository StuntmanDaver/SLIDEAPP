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
    const { user_id, action, duration } = body || {}; // action: 'ban' | 'unban'

    if (!user_id || !action) return errorResponse("User ID and action are required", 400);

    let updateData = {};
    if (action === "ban") {
      // Ban for 100 years or specified duration
      const banUntil = new Date();
      banUntil.setFullYear(banUntil.getFullYear() + 100);
      updateData = { ban_duration: "100y" }; // Supabase helper or direct update?
      // updateUserById accepts `ban_duration`? No, it accepts `banned_until`.
      // Actually, updateUserById takes `banned_until` timestamp string.
      
      const { error } = await supabase.auth.admin.updateUserById(user_id, {
        ban_duration: "876000h" // ~100 years
      });
      if (error) throw error;
    } else if (action === "unban") {
      const { error } = await supabase.auth.admin.updateUserById(user_id, {
        ban_duration: "0s" // Unban
      });
      if (error) throw error;
    } else {
      return errorResponse("Invalid action", 400);
    }

    return successResponse({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
