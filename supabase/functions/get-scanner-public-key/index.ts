import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, requireRole, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  try {
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) return errorResponse("Unauthorized", 401);

    const isStaff = await requireRole(user.user_id, ["scanner", "admin"], supabase);
    if (!isStaff) return errorResponse("Forbidden", 403);

    const publicKey = Deno.env.get("QR_TOKEN_ECDSA_PUBLIC_KEY");
    if (!publicKey) {
      return errorResponse("Server configuration error", 500);
    }

    return successResponse({
      public_key: publicKey,
      format: "raw",
      alg: "ES256",
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
