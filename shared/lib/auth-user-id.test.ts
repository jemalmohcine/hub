import { test, expect } from "vitest";
import { extractAuthUserId, subFromJwt } from "./auth-user-id";

test("extractAuthUserId uses JWT sub", () => {
  expect(extractAuthUserId({ sub: "uuid-1", role: "authenticated" }, null)).toBe("uuid-1");
});

test("extractAuthUserId falls back to session user id", () => {
  expect(extractAuthUserId(null, "uuid-2")).toBe("uuid-2");
});

test("extractAuthUserId falls back to access token payload", () => {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "uuid-from-token" })).toString("base64url");
  const token = `${header}.${payload}.sig`;
  expect(extractAuthUserId(null, null, token)).toBe("uuid-from-token");
  expect(subFromJwt(token)).toBe("uuid-from-token");
});

test("extractAuthUserId ignores wrong id field on claims without sub", () => {
  expect(extractAuthUserId({ id: "legacy" }, "uuid-3")).toBe("legacy");
});
