import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";
import { signQRToken } from "../_shared/qr-token.ts";
import { p256 } from "https://esm.sh/@noble/curves@1.4.0/p256";

// 5 minutes TTL for QR tokens
const QR_TOKEN_TTL_SECONDS = 300;

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function base64UrlFromBytes(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

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

    // Get signing secret (fallback for local dev)
    const signingSecret = Deno.env.get("QR_TOKEN_SIGNING_SECRET") || "test-secret-12345678901234567890123456789012";
    if (!signingSecret) {
      return errorResponse("Server configuration error", 500);
    }

    // Sign QR token
    const { token, exp } = await signQRToken(
      pass.pass_id,
      signingSecret,
      QR_TOKEN_TTL_SECONDS
    );

    const privateKey = Deno.env.get("QR_TOKEN_ECDSA_PRIVATE_KEY");
    if (!privateKey) {
      return errorResponse("Server configuration error", 500);
    }

    const signature = p256.sign(new TextEncoder().encode(token), base64UrlToBytes(privateKey));
    const qrPayload = JSON.stringify({
      token,
      sig: base64UrlFromBytes(signature.toRawBytes()),
      exp,
    });

    return successResponse({
      qr_token: qrPayload,
      exp,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
