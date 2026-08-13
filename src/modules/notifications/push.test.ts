import { describe, expect, it } from "vitest";
import { isUrgentPush } from "@/modules/notifications/push";

describe("isUrgentPush", () => {
  it("allows only urgent payloads through to the phone", () => {
    expect(isUrgentPush({ severity: "urgent" })).toBe(true);
  });

  it("blocks info, success and warning", () => {
    expect(isUrgentPush({ severity: "info" })).toBe(false);
    expect(isUrgentPush({ severity: "success" })).toBe(false);
    expect(isUrgentPush({ severity: "warning" })).toBe(false);
    expect(isUrgentPush({})).toBe(false);
  });
});
