import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, requireRole, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

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

    const body = await parseJsonBody(req);
    const { page = 1, limit = 20, search } = body || {};
    const offset = (page - 1) * limit;

    // We need to query auth.users which is only accessible via service role client (which we have)
    // However, Supabase JS client doesn't expose auth.users query easily like tables.
    // We use listUsers() from auth admin API.

    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: limit,
    });

    if (error) throw error;

    // Filter by email if search provided (client-side filter for now as listUsers search is limited)
    let filteredUsers = users;
    if (search) {
      filteredUsers = users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.id === search);
    }

    // Enhance with profile, subscription, balance
    const userIds = filteredUsers.map(u => u.id);
    
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
    const { data: subscriptions } = await supabase.from("subscriptions").select("*").in("user_id", userIds);
    const { data: balances } = await supabase.from("pass_balances").select("*").in("user_id", userIds);

    const result = filteredUsers.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      profile: profiles?.find(p => p.user_id === u.id),
      subscription: subscriptions?.find(s => s.user_id === u.id),
      balance: balances?.find(b => b.user_id === u.id),
    }));

    return successResponse({ users: result });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
