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
    const { pass_id } = body || {};

    if (!pass_id) {
      return errorResponse("pass_id is required", 400);
    }

    // Check if pass exists and is not already revoked or redeemed
    const { data: pass, error: fetchError } = await supabase
      .from("passes")
      .select("pass_id, status")
      .eq("pass_id", pass_id)
      .single();

    if (fetchError || !pass) {
      return errorResponse("Pass not found", 404);
    }

    if (pass.status === "revoked") {
      return errorResponse("Pass is already revoked", 400);
    }

    if (pass.status === "redeemed") {
      return errorResponse("Cannot revoke a redeemed pass", 400);
    }

    // Update pass status to revoked
    const { data: updatedPass, error: updateError } = await supabase
      .from("passes")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("pass_id", pass_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return successResponse({
      success: true,
      pass: updatedPass,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
