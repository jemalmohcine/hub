import { describe, expect, it } from "vitest";
import { resolveAuthUserId } from "./auth-user-id";

describe("resolveAuthUserId", () => {
  it("uses id when present", () => {
    expect(resolveAuthUserId({ id: "uuid-a" })).toBe("uuid-a");
  });

  it("falls back to JWT sub", () => {
    expect(resolveAuthUserId({ sub: "uuid-b" })).toBe("uuid-b");
  });

  it("returns null when missing", () => {
    expect(resolveAuthUserId(null)).toBeNull();
    expect(resolveAuthUserId({})).toBeNull();
  });
});
