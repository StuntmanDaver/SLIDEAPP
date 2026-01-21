import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, requireRole, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";

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
    const user = await getAuthenticatedUser(req, supabase);
    if (!user) return errorResponse("Unauthorized", 401);

    const isAdmin = await requireRole(user.user_id, "admin", supabase);
    if (!isAdmin) return errorResponse("Forbidden", 403);

    // 1. Get all staff users from database
    const { data: staffUsers, error: staffError } = await supabase
      .from("staff_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (staffError) throw staffError;

    // 2. Fetch email/details for each staff user from Auth Admin API
    // We use Promise.all to fetch them in parallel. 
    // Optimization: If listUsers supports filtering by ID array in future, use that.
    // For now, getUserById is reliable.
    const staffWithDetails = await Promise.all(
      staffUsers.map(async (staff) => {
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(staff.user_id);
        
        if (userError || !user) {
          console.error(`Could not find auth user for staff ${staff.user_id}:`, userError);
          return {
            ...staff,
            email: "Unknown (User not found)",
            last_sign_in_at: null
          };
        }

        return {
          ...staff,
          email: user.email,
          last_sign_in_at: user.last_sign_in_at,
          created_at: user.created_at // Prefer auth creation date? Or stick to staff record creation? 
          // keeping staff.created_at as the "Staff Member Since" date usually makes sense, 
          // but we can pass both if needed.
        };
      })
    );

    return successResponse({ staff: staffWithDetails });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
