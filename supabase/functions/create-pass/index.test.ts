import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { handler } from "./index.ts";

// Simple unit tests for request validation
// Deeper logic requires mocking Supabase client which is complex in this setup
// In a real CI, we would use integration tests against a local Supabase instance

Deno.test("create-pass: returns 405 for non-POST requests", async () => {
  const req = new Request("http://localhost", { method: "GET" });
  const res = await handler(req);
  assertEquals(res.status, 405);
  const body = await res.json();
  assertEquals(body.error, "Method not allowed");
});

Deno.test("create-pass: returns 401 if unauthorized (mock check)", async () => {
  // Since we can't easily mock getAuthenticatedUser here without DI,
  // we expect 401 because the Authorization header is missing/invalid
  // and getAuthenticatedUser will return null.
  
  const req = new Request("http://localhost", { 
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
});
