import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    if (!body || !body.expo_push_token) {
      return errorResponse("Missing expo_push_token", 400);
    }

    const { expo_push_token, platform } = body;

    // Validate token format (Expo push tokens start with ExponentPushToken[)
    if (!expo_push_token.startsWith("ExponentPushToken[")) {
      return errorResponse("Invalid Expo push token format", 400);
    }

    // Upsert the push token
    const { error: upsertError } = await supabase
      .from("push_tokens")
      .upsert(
        {
          user_id: user.user_id,
          expo_push_token,
          platform: platform || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Error upserting push token:", upsertError);
      return errorResponse("Failed to register push token", 500);
    }

    return successResponse({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
