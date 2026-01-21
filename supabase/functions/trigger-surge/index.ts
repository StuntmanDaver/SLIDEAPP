import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, getStaffRole, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
}

async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  // Expo Push API allows batches of up to 100 messages
  const batchSize = 100;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Expo Push API error:", errorText);
    }
  }
}

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
    // Parse request body
    const body = await parseJsonBody(req);

    // Determine if this is an automated trigger or manual
    const triggerType = body?.trigger_type || "manual";

    // For manual triggers, verify admin/staff role
    if (triggerType === "manual") {
      const user = await getAuthenticatedUser(req, supabase);
      if (!user) {
        return errorResponse("Unauthorized", 401);
      }

      const role = await getStaffRole(user.user_id, supabase);
      if (!role || !["admin", "manager"].includes(role)) {
        return errorResponse("Forbidden: Admin or Manager role required", 403);
      }
    }

    // Get surge config
    const { data: config } = await supabase
      .from("surge_config")
      .select("*")
      .eq("config_id", "default")
      .single();

    const durationMinutes = config?.surge_duration_minutes || 30;
    const maxClaims = body?.max_claims || config?.max_claims_per_surge || 50;

    // Create the surge event
    const title = body?.title || "SURGE: Priority Entry Available!";
    const message = body?.message || "Claim your priority spot now. First come, first served!";
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    const { data: surge, error: surgeError } = await supabase
      .from("surge_events")
      .insert({
        trigger_type: triggerType,
        title,
        message,
        max_claims: maxClaims,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (surgeError || !surge) {
      console.error("Error creating surge:", surgeError);
      return errorResponse("Failed to create surge event", 500);
    }

    // Get all push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("expo_push_token");

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      // Continue anyway - surge is created, just no notifications
    }

    // Send push notifications to all users
    if (tokens && tokens.length > 0) {
      const messages: ExpoPushMessage[] = tokens.map((t) => ({
        to: t.expo_push_token,
        title,
        body: message,
        sound: "default",
        priority: "high",
        data: {
          type: "surge",
          surge_id: surge.surge_id,
        },
      }));

      // Send asynchronously (don't wait)
      sendExpoPushNotifications(messages).catch((err) => {
        console.error("Error sending push notifications:", err);
      });
    }

    return successResponse({
      surge_id: surge.surge_id,
      title: surge.title,
      message: surge.message,
      max_claims: surge.max_claims,
      expires_at: surge.expires_at,
      notifications_sent: tokens?.length || 0,
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
