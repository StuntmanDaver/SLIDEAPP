import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

export interface AuthToken {
  sub: string; // user_id
  email?: string;
  role?: string;
  iat: number;
  exp: number;
}

export interface StaffUser {
  role: string;
  is_active: boolean;
}

/**
 * Extract JWT from Authorization header
 */
export function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const matches = authHeader.match(/^Bearer (.+)$/);
  return matches ? matches[1] : null;
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwtDecode<AuthToken>(token);
    if (!decoded.sub) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(
  req: Request,
  supabase: SupabaseClient
): Promise<{ user_id: string } | null> {
  const token = getAuthToken(req);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return { user_id: decoded.sub };
}

/**
 * Get user's staff role
 */
export async function getStaffRole(
  user_id: string,
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("staff_users")
      .select("role, is_active")
      .eq("user_id", user_id)
      .single();

    if (error || !data) return null;
    
    // Cast data to expected shape since we don't have generated types here
    const staffData = data as unknown as StaffUser;
    
    if (!staffData.is_active) return null;

    return staffData.role;
  } catch {
    return null;
  }
}

/**
 * Verify user has specific role
 */
export async function requireRole(
  user_id: string,
  requiredRole: string | string[],
  supabase: SupabaseClient
): Promise<boolean> {
  const role = await getStaffRole(user_id, supabase);
  if (!role) return false;

  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return requiredRoles.includes(role);
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

/**
 * Create error response
 */
export function errorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Create success response
 */
export function successResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
