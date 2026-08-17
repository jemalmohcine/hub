import { describe, expect, it } from "vitest";
import { hasPasswordLogin } from "@/core/auth/identities";

describe("hasPasswordLogin", () => {
  it("is false for a Google-only account", () => {
    expect(
      hasPasswordLogin({
        identities: [{ provider: "google" }],
        app_metadata: { providers: ["google"] },
      }),
    ).toBe(false);
  });

  it("is true once the email identity is linked", () => {
    expect(
      hasPasswordLogin({
        identities: [{ provider: "google" }, { provider: "email" }],
        app_metadata: { providers: ["google", "email"] },
      }),
    ).toBe(true);
  });

  it("reads app_metadata.providers when identities are missing", () => {
    expect(
      hasPasswordLogin({
        app_metadata: { providers: ["email"] },
      }),
    ).toBe(true);
  });

  it("is false without a user", () => {
    expect(hasPasswordLogin(null)).toBe(false);
  });
});
