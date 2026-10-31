import { test, expect } from "vitest";
import { extractAuthUserId } from "./auth-user-id";

test("extractAuthUserId uses JWT sub", () => {
  expect(extractAuthUserId({ sub: "uuid-1", role: "authenticated" }, null)).toBe("uuid-1");
});

test("extractAuthUserId falls back to session user id", () => {
  expect(extractAuthUserId(null, "uuid-2")).toBe("uuid-2");
});

test("extractAuthUserId ignores wrong id field on claims without sub", () => {
  expect(extractAuthUserId({ id: "legacy" }, "uuid-3")).toBe("legacy");
});
