import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Allow GET or POST (Supabase functions.invoke defaults to POST)
  if (req.method !== "GET" && req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // Initialize Supabase
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  try {
    // Get all active plans
    const { data: plans, error } = await supabase
      .from("plans")
      .select("plan_id, name, stripe_price_id, passes_per_period, tier, billing_type, price_cents, is_active")
      .eq("is_active", true)
      .order("price_cents", { ascending: true });

    if (error) {
      console.error("Error fetching plans:", error);
      return errorResponse("Failed to fetch plans", 500);
    }

    return successResponse({ plans: plans || [] });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
