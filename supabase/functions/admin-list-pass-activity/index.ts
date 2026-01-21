import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser, requireRole, errorResponse, successResponse, corsHeaders } from "../_shared/auth.ts";
import { parseJsonBody } from "../_shared/utils.ts";

serve(async (req: Request) => {
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
    const {
      limit = 100,
      offset = 0,
      status,
      dateFrom,
      dateTo,
      searchUserId,
      searchPassId
    } = body || {};

    // Build query for passes with owner info
    let query = supabase
      .from("passes")
      .select(`
        pass_id,
        status,
        created_at,
        claimed_at,
        redeemed_at,
        redeemed_device_id,
        issuer_user_id,
        owner_user_id
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (dateFrom) {
      query = query.gte("created_at", new Date(dateFrom).toISOString());
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt("created_at", endDate.toISOString());
    }

    if (searchUserId) {
      query = query.or(`issuer_user_id.eq.${searchUserId},owner_user_id.eq.${searchUserId}`);
    }

    if (searchPassId) {
      query = query.ilike("pass_id", `%${searchPassId}%`);
    }

    const { data: passes, error: passesError } = await query;

    if (passesError) throw passesError;

    // Get unique user IDs to fetch user info
    const userIds = new Set<string>();
    passes?.forEach((p) => {
      if (p.issuer_user_id) userIds.add(p.issuer_user_id);
      if (p.owner_user_id) userIds.add(p.owner_user_id);
    });

    // Fetch user emails from auth.users (accessible with service role)
    const userMap: Record<string, { email: string }> = {};
    if (userIds.size > 0) {
      // Use admin API to get user details
      const userIdArray = Array.from(userIds);
      for (const uid of userIdArray) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(uid);
          if (userData?.user?.email) {
            userMap[uid] = { email: userData.user.email };
          }
        } catch {
          // User not found, skip
        }
      }
    }

    // Enrich passes with user info
    const enrichedPasses = passes?.map((p) => ({
      ...p,
      issuer_email: p.issuer_user_id ? userMap[p.issuer_user_id]?.email || "Unknown" : null,
      owner_email: p.owner_user_id ? userMap[p.owner_user_id]?.email || "Unknown" : null,
    }));

    // Calculate stats for the date range
    const statsQuery = supabase.from("passes").select("status", { count: "exact", head: false });

    let statsDateFilter = statsQuery;
    if (dateFrom) {
      statsDateFilter = statsDateFilter.gte("created_at", new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      statsDateFilter = statsDateFilter.lt("created_at", endDate.toISOString());
    }

    // Get counts by status
    const [
      { count: totalCount },
      { count: createdCount },
      { count: claimedCount },
      { count: redeemedCount },
      { count: expiredCount },
      { count: revokedCount }
    ] = await Promise.all([
      supabase.from("passes").select("*", { count: "exact", head: true }),
      supabase.from("passes").select("*", { count: "exact", head: true }).eq("status", "created"),
      supabase.from("passes").select("*", { count: "exact", head: true }).eq("status", "claimed"),
      supabase.from("passes").select("*", { count: "exact", head: true }).eq("status", "redeemed"),
      supabase.from("passes").select("*", { count: "exact", head: true }).eq("status", "expired"),
      supabase.from("passes").select("*", { count: "exact", head: true }).eq("status", "revoked"),
    ]);

    // Fraud detection: Find passes with multiple scan attempts (could indicate sharing)
    const { data: suspiciousPasses } = await supabase
      .from("scan_events")
      .select("pass_id, device_id")
      .not("pass_id", "is", null);

    // Group scans by pass_id and count unique devices
    const passDeviceMap: Record<string, Set<string>> = {};
    suspiciousPasses?.forEach((scan) => {
      if (!scan.pass_id) return;
      if (!passDeviceMap[scan.pass_id]) {
        passDeviceMap[scan.pass_id] = new Set();
      }
      if (scan.device_id) {
        passDeviceMap[scan.pass_id].add(scan.device_id);
      }
    });

    // Passes scanned from multiple devices (potential fraud)
    const multiDevicePasses = Object.entries(passDeviceMap)
      .filter(([_, devices]) => devices.size > 1)
      .map(([passId, devices]) => ({
        pass_id: passId,
        device_count: devices.size,
      }));

    // Get passes with "USED" scan results (already redeemed attempts)
    const { data: reusedAttempts } = await supabase
      .from("scan_events")
      .select("pass_id")
      .eq("result", "USED")
      .not("pass_id", "is", null);

    const reusedPassIds = new Set(reusedAttempts?.map((r) => r.pass_id));

    // Today's activity stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [
      { count: issuedToday },
      { count: redeemedToday },
      { count: expiredToday }
    ] = await Promise.all([
      supabase.from("passes").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
      supabase.from("passes").select("*", { count: "exact", head: true }).gte("redeemed_at", todayISO),
      supabase.from("passes").select("*", { count: "exact", head: true }).eq("status", "expired").gte("created_at", todayISO),
    ]);

    return successResponse({
      passes: enrichedPasses,
      stats: {
        total: totalCount || 0,
        created: createdCount || 0,
        claimed: claimedCount || 0,
        redeemed: redeemedCount || 0,
        expired: expiredCount || 0,
        revoked: revokedCount || 0,
        issued_today: issuedToday || 0,
        redeemed_today: redeemedToday || 0,
        expired_today: expiredToday || 0,
      },
      fraud_indicators: {
        multi_device_passes: multiDevicePasses.slice(0, 20),
        reuse_attempts_count: reusedPassIds.size,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
