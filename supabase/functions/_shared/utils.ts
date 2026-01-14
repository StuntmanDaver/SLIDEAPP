/**
 * Generate a random token for claiming passes
 */
export function generateClaimToken(length: number = 32): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let token = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    token += charset[array[i] % charset.length];
  }

  return token;
}

/**
 * Hash a token using SHA-256
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a hashed token
 */
export async function verifyHashedToken(
  plainToken: string,
  hashedToken: string
): Promise<boolean> {
  const hash = await hashToken(plainToken);
  return hash === hashedToken;
}

/**
 * Parse request body as JSON
 */
export async function parseJsonBody(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
