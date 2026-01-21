import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, requireRole, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    const { email, password, role } = body || {};

    if (!email || !password || !role) return errorResponse("Email, password, and role are required", 400);

    // Create user in Auth
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      // Check for duplicate user error
      if (createError.message?.includes("already") || createError.message?.includes("exists")) {
        return errorResponse("A user with this email already exists", 409);
      }
      throw createError;
    }
    if (!user) throw new Error("Failed to create user");

    // Add to staff_users
    const { error: staffError } = await supabase
      .from("staff_users")
      .insert({
        user_id: user.id,
        role: role,
        is_active: true
      });

    if (staffError) {
      // Rollback auth user creation? Or just fail.
      // For MVP, we'll try to delete the user to cleanup.
      await supabase.auth.admin.deleteUser(user.id);
      throw staffError;
    }

    return successResponse({ user_id: user.id });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse(error instanceof Error ? error.message : "Internal server error", 500);
  }
});
