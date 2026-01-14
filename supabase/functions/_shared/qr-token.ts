import { QR_TOKEN_TTL_SECONDS } from "../_shared/constants.ts";

export interface QRTokenPayload {
  pass_id: string;
  exp: number;
  jti: string;
  aud: "scanner";
  iat: number;
}

/**
 * Generate a unique JWT ID
 */
function generateJTI(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Create base64url encoding (JWT compatible)
 */
function base64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Sign QR token using HMAC-SHA256
 */
export async function signQRToken(
  passId: string,
  signingSecret: string,
  ttlSeconds: number = QR_TOKEN_TTL_SECONDS
): Promise<{ token: string; exp: number }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSeconds;

  const payload: QRTokenPayload = {
    pass_id: passId,
    exp,
    jti: generateJTI(),
    aud: "scanner",
    iat: now,
  };

  // Create JWT header
  const header = { alg: "HS256", typ: "JWT" };
  const headerEncoded = base64url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const payloadEncoded = base64url(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  // Create signature
  const message = `${headerEncoded}.${payloadEncoded}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  const signatureEncoded = base64url(new Uint8Array(signature));

  const token = `${message}.${signatureEncoded}`;

  return { token, exp };
}

/**
 * Verify QR token signature
 */
export async function verifyQRToken(
  token: string,
  signingSecret: string
): Promise<QRTokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;

    // Verify signature
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(signingSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const message = `${headerEncoded}.${payloadEncoded}`;
    const signature = Uint8Array.from(
      atob(signatureEncoded.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(message)
    );

    if (!isValid) return null;

    // Decode and parse payload
    const payloadJson = atob(payloadEncoded.replace(/-/g, "+").replace(/_/g, "/"));
    const payload: QRTokenPayload = JSON.parse(payloadJson);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    // Check audience
    if (payload.aud !== "scanner") return null;

    return payload;
  } catch {
    return null;
  }
}
