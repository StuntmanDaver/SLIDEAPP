import AsyncStorage from "@react-native-async-storage/async-storage";
import { p256 } from "@noble/curves/p256";

const PUBLIC_KEY_CACHE_KEY = "scanner_public_key";
const PUBLIC_KEY_CACHE_TS_KEY = "scanner_public_key_ts";

interface SignedQrPayload {
  token: string;
  sig: string;
  exp?: number;
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export function parseQrToken(raw: string): { token: string; signature?: string } {
  if (raw.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as SignedQrPayload;
      if (parsed.token && parsed.sig) {
        return { token: parsed.token, signature: parsed.sig };
      }
    } catch {
      // fall through to treat as raw token
    }
  }

  return { token: raw };
}

export async function cacheScannerPublicKey(publicKey: string) {
  await AsyncStorage.setItem(PUBLIC_KEY_CACHE_KEY, publicKey);
  await AsyncStorage.setItem(PUBLIC_KEY_CACHE_TS_KEY, Date.now().toString());
}

export async function getCachedScannerPublicKey(): Promise<string | null> {
  return AsyncStorage.getItem(PUBLIC_KEY_CACHE_KEY);
}

export async function shouldRefreshPublicKey(maxAgeMs: number): Promise<boolean> {
  const ts = await AsyncStorage.getItem(PUBLIC_KEY_CACHE_TS_KEY);
  if (!ts) return true;
  const age = Date.now() - Number(ts);
  return Number.isNaN(age) || age > maxAgeMs;
}

export function verifyQrSignature(token: string, signature: string, publicKey: string): boolean {
  try {
    const signatureBytes = base64UrlToBytes(signature);
    const publicKeyBytes = base64UrlToBytes(publicKey);
    const messageBytes = new TextEncoder().encode(token);
    return p256.verify(signatureBytes, messageBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

export function getPassIdFromToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(payloadPart);
    const payload = JSON.parse(payloadJson) as { pass_id?: string };
    return payload.pass_id || null;
  } catch {
    return null;
  }
}
