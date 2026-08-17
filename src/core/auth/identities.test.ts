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

  it("ignores email in app_metadata when a Google identity exists", () => {
    expect(
      hasPasswordLogin({
        identities: [{ provider: "google" }],
        app_metadata: { providers: ["google", "email"] },
      }),
    ).toBe(false);
  });

  it("does not treat OAuth users as password users when identities are missing", () => {
    expect(
      hasPasswordLogin({
        app_metadata: { providers: ["google", "email"] },
      }),
    ).toBe(false);
  });

  it("reads app_metadata.providers for a classic email account", () => {
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
