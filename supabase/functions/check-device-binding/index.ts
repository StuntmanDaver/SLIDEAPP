import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // Initialize Supabase with service role
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

    // Parse request body
    const body = await parseJsonBody(req);
    if (!body || !body.device_id) {
      return errorResponse("Missing device_id", 400);
    }

    const { device_id } = body;

    // Check if user has an existing device binding
    const { data: userBinding, error: userBindingError } = await supabase
      .from("device_bindings")
      .select("device_id, device_name, platform")
      .eq("user_id", user.user_id)
      .single();

    if (userBindingError && userBindingError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is fine
      console.error("Error checking user binding:", userBindingError);
      return errorResponse("Failed to check device binding", 500);
    }

    if (!userBinding) {
      // No binding exists for this user
      return successResponse({
        is_bound: false,
        is_current_device: true, // No binding, so current device is fine
      });
    }

    // User has a binding - check if it matches current device
    if (userBinding.device_id === device_id) {
      // Current device matches bound device
      // Update last_active_at
      await supabase
        .from("device_bindings")
        .update({ last_active_at: new Date().toISOString() })
        .eq("user_id", user.user_id);

      return successResponse({
        is_bound: true,
        is_current_device: true,
        bound_device_name: userBinding.device_name,
      });
    }

    // Different device - this is blocked!
    return successResponse({
      is_bound: true,
      is_current_device: false,
      bound_device_name: userBinding.device_name || "Unknown Device",
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
