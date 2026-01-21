import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

// Cooldown period for device transfers (7 days in milliseconds)
const TRANSFER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

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
    if (!body || !body.new_device_id) {
      return errorResponse("Missing new_device_id", 400);
    }

    const { new_device_id, new_device_name, platform } = body;

    // Check if new device is already bound to another user
    const { data: existingBinding } = await supabase
      .from("device_bindings")
      .select("user_id")
      .eq("device_id", new_device_id)
      .single();

    if (existingBinding && existingBinding.user_id !== user.user_id) {
      return errorResponse("This device is already bound to another account", 403);
    }

    // Get current binding
    const { data: currentBinding } = await supabase
      .from("device_bindings")
      .select("device_id, bound_at")
      .eq("user_id", user.user_id)
      .single();

    if (currentBinding) {
      // Check cooldown period
      const boundAt = new Date(currentBinding.bound_at).getTime();
      const now = Date.now();
      const timeSinceBinding = now - boundAt;

      if (timeSinceBinding < TRANSFER_COOLDOWN_MS) {
        const daysRemaining = Math.ceil(
          (TRANSFER_COOLDOWN_MS - timeSinceBinding) / (24 * 60 * 60 * 1000)
        );
        return errorResponse(
          `Device transfer on cooldown. Please wait ${daysRemaining} more day(s).`,
          403
        );
      }

      // Update the binding to the new device
      const { error: updateError } = await supabase
        .from("device_bindings")
        .update({
          device_id: new_device_id,
          device_name: new_device_name || null,
          platform: platform || null,
          bound_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        })
        .eq("user_id", user.user_id);

      if (updateError) {
        console.error("Error updating device binding:", updateError);
        return errorResponse("Failed to transfer device", 500);
      }
    } else {
      // No existing binding - create new one
      const { error: insertError } = await supabase
        .from("device_bindings")
        .insert({
          user_id: user.user_id,
          device_id: new_device_id,
          device_name: new_device_name || null,
          platform: platform || null,
        });

      if (insertError) {
        console.error("Error creating device binding:", insertError);
        return errorResponse("Failed to bind device", 500);
      }
    }

    return successResponse({
      success: true,
      device_id: new_device_id,
      message: "Device transferred successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
