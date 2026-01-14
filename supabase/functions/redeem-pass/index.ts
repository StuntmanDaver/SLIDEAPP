import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, requireRole, errorResponse, successResponse } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";
import { verifyQRToken } from "../_shared/qr-token.ts";
import { SCAN_RESULTS } from "../_shared/constants.ts";
import { checkRateLimit, RATE_LIMIT_CONFIGS, rateLimitErrorResponse } from "../_shared/rate-limit.ts";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  try {
    // Get authenticated user (staff only)
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Verify staff role
    const isStaff = await requireRole(user.user_id, ["scanner", "admin"], supabase);
    if (!isStaff) {
      return errorResponse("Forbidden", 403);
    }

    // Parse request body
    const body = await parseJsonBody(req);
    if (!body || !body.qr_token || !body.device_id) {
      return errorResponse("Missing qr_token or device_id", 400);
    }

    // Rate limit by device
    const rateLimit = checkRateLimit(`redeem:${body.device_id}`, RATE_LIMIT_CONFIGS.redeem);
    if (!rateLimit.allowed) {
      return rateLimitErrorResponse(rateLimit.resetAt);
    }

    const startTime = Date.now();

    // Verify QR token signature
    const signingSecret = Deno.env.get("QR_TOKEN_SIGNING_SECRET");
    if (!signingSecret) {
      return errorResponse("Server configuration error", 500);
    }

    const verifyResult = await verifyQRToken(body.qr_token, signingSecret);
    if (!verifyResult.valid) {
      const latency = Date.now() - startTime;
      const result = verifyResult.reason === "expired" 
        ? SCAN_RESULTS.EXPIRED 
        : SCAN_RESULTS.INVALID;
      // Log scan with appropriate result
      await supabase.from("scan_events").insert({
        result,
        scanner_staff_id: user.user_id,
        device_id: body.device_id,
        latency_ms: latency,
      });
      return successResponse({ result });
    }

    const passId = verifyResult.payload.pass_id;

    // Atomic redeem: only transition from 'claimed' to 'redeemed'
    const { data: updatedPass, error: updateError } = await supabase
      .from("passes")
      .update({
        status: "redeemed",
        redeemed_at: new Date().toISOString(),
        redeemed_by_staff_id: user.user_id,
        redeemed_device_id: body.device_id,
      })
      .eq("pass_id", passId)
      .eq("status", "claimed")
      .select()
      .single();

    const latency = Date.now() - startTime;

    // If no row was updated, pass was already redeemed or doesn't exist
    if (!updatedPass) {
      // Check if pass exists and get its status
      const { data: pass } = await supabase
        .from("passes")
        .select("status")
        .eq("pass_id", passId)
        .single();

      if (!pass) {
        // Log invalid scan
        await supabase.from("scan_events").insert({
          pass_id: passId,
          result: SCAN_RESULTS.INVALID,
          scanner_staff_id: user.user_id,
          device_id: body.device_id,
          latency_ms: latency,
        });
        return successResponse({ result: SCAN_RESULTS.INVALID });
      }

      if (pass.status === "redeemed") {
        // Log used scan
        await supabase.from("scan_events").insert({
          pass_id: passId,
          result: SCAN_RESULTS.USED,
          scanner_staff_id: user.user_id,
          device_id: body.device_id,
          latency_ms: latency,
        });
        return successResponse({ result: SCAN_RESULTS.USED });
      }

      if (pass.status === "revoked") {
        // Log revoked scan
        await supabase.from("scan_events").insert({
          pass_id: passId,
          result: SCAN_RESULTS.REVOKED,
          scanner_staff_id: user.user_id,
          device_id: body.device_id,
          latency_ms: latency,
        });
        return successResponse({ result: SCAN_RESULTS.REVOKED });
      }

      // Other status
      await supabase.from("scan_events").insert({
        pass_id: passId,
        result: SCAN_RESULTS.INVALID,
        scanner_staff_id: user.user_id,
        device_id: body.device_id,
        latency_ms: latency,
      });
      return successResponse({ result: SCAN_RESULTS.INVALID });
    }

    // Successful redemption
    await supabase.from("scan_events").insert({
      pass_id: passId,
      result: SCAN_RESULTS.VALID,
      scanner_staff_id: user.user_id,
      device_id: body.device_id,
      latency_ms: latency,
    });

    return successResponse({
      result: SCAN_RESULTS.VALID,
      pass_id: updatedPass.pass_id,
      redeemed_at: updatedPass.redeemed_at,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
