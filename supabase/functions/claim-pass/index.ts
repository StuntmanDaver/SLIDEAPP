import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse } from "../_shared/auth.ts";
import { hashToken, parseJsonBody } from "../_shared/utils.ts";

serve(async (req: Request) => {
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

    // Parse request body
    const body = await parseJsonBody(req);
    if (!body || !body.token) {
      return errorResponse("Missing token", 400);
    }

    const plainToken = body.token;
    const tokenHash = await hashToken(plainToken);

    // Find pass by claim token hash
    const { data: pass } = await supabase
      .from("passes")
      .select()
      .eq("claim_token_hash", tokenHash)
      .single();

    if (!pass) {
      return errorResponse("Invalid link", 404);
    }

    // Check pass status
    if (pass.status === "claimed") {
      return errorResponse("Pass already claimed", 400);
    }

    if (pass.status === "revoked") {
      return errorResponse("Pass revoked", 400);
    }

    if (pass.status !== "created") {
      return errorResponse("Pass cannot be claimed", 400);
    }

    // Update pass: claim it
    const { data: updatedPass, error: updateError } = await supabase
      .from("passes")
      .update({
        owner_user_id: user.user_id,
        claimed_at: new Date().toISOString(),
        status: "claimed",
        claim_token_hash: null, // Invalidate token
      })
      .eq("pass_id", pass.pass_id)
      .select()
      .single();

    if (updateError || !updatedPass) {
      return errorResponse("Failed to claim pass", 500);
    }

    return successResponse({
      pass_id: updatedPass.pass_id,
      status: updatedPass.status,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
