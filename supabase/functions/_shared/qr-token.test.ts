import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { signQRToken, verifyQRToken } from "./qr-token.ts";

const SECRET = "test-secret-key-123";
const PASS_ID = "test-pass-id";

Deno.test("signQRToken: generates valid token", async () => {
  const { token, exp } = await signQRToken(PASS_ID, SECRET);
  
  assertEquals(typeof token, "string");
  assertEquals(token.split(".").length, 3);
  assertEquals(exp > Math.floor(Date.now() / 1000), true);
});

Deno.test("verifyQRToken: verifies valid token", async () => {
  const { token } = await signQRToken(PASS_ID, SECRET);
  const result = await verifyQRToken(token, SECRET);
  
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.payload.pass_id, PASS_ID);
    assertEquals(result.payload.aud, "scanner");
  }
});

Deno.test("verifyQRToken: rejects modified token as invalid", async () => {
  const { token } = await signQRToken(PASS_ID, SECRET);
  const parts = token.split(".");
  // Tamper with payload
  parts[1] = btoa(JSON.stringify({ pass_id: "hacked", exp: 9999999999, aud: "scanner" })).replace(/=/g, "");
  const tamperedToken = parts.join(".");
  
  const result = await verifyQRToken(tamperedToken, SECRET);
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.reason, "invalid");
  }
});

Deno.test("verifyQRToken: rejects wrong secret as invalid", async () => {
  const { token } = await signQRToken(PASS_ID, SECRET);
  const result = await verifyQRToken(token, "wrong-secret");
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.reason, "invalid");
  }
});

Deno.test("verifyQRToken: rejects expired token with expired reason", async () => {
  // Sign with -10 seconds TTL (already expired)
  const { token } = await signQRToken(PASS_ID, SECRET, -10);
  const result = await verifyQRToken(token, SECRET);
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.reason, "expired");
  }
});
