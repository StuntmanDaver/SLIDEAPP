/**
 * Simple in-memory rate limiter for Edge Functions
 * Note: This resets on function cold starts. For production, consider using Redis or Supabase.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

// Default configs for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  auth: { windowMs: 60000, maxRequests: 10 },      // 10 requests per minute
  claim: { windowMs: 60000, maxRequests: 5 },       // 5 claims per minute
  redeem: { windowMs: 1000, maxRequests: 10 },      // 10 scans per second per device
  createPass: { windowMs: 60000, maxRequests: 10 }, // 10 passes per minute
  surgeClaim: { windowMs: 60000, maxRequests: 5 },  // 5 surge claim attempts per minute
} as const;

/**
 * Check if a request is rate limited
 * @param key Unique identifier (e.g., user_id, IP, device_id)
 * @param config Rate limit configuration
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or window has passed, create new entry
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Check if over limit
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(remaining: number, resetAt: number): Record<string, string> {
  return {
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.floor(resetAt / 1000).toString(),
  };
}

/**
 * Rate limit error response
 */
export function rateLimitErrorResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests", retry_after: retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        ...rateLimitHeaders(0, resetAt),
      },
    }
  );
}
