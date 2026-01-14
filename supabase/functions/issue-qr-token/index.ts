import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";
import { signQRToken, QR_TOKEN_TTL_SECONDS } from "../_shared/qr-token.ts";

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
    if (!body || !body.pass_id) {
      return errorResponse("Missing pass_id", 400);
    }

    // Get pass
    const { data: pass } = await supabase
      .from("passes")
      .select()
      .eq("pass_id", body.pass_id)
      .single();

    if (!pass) {
      return errorResponse("Pass not found", 404);
    }

    // Verify user owns the pass
    if (pass.owner_user_id !== user.user_id) {
      return errorResponse("Forbidden", 403);
    }

    // Verify pass is claimed
    if (pass.status !== "claimed") {
      return errorResponse("Pass not ready", 400);
    }

    // Get signing secret
    const signingSecret = Deno.env.get("QR_TOKEN_SIGNING_SECRET");
    if (!signingSecret) {
      return errorResponse("Server configuration error", 500);
    }

    // Sign QR token
    const { token, exp } = await signQRToken(
      pass.pass_id,
      signingSecret,
      QR_TOKEN_TTL_SECONDS
    );

    return successResponse({
      qr_token: token,
      exp,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
