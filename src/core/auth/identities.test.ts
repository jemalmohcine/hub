import { describe, expect, it } from "vitest";
import { hasOAuthLogin, hasPasswordLogin } from "@/core/auth/identities";

describe("hasOAuthLogin", () => {
  it("is true for a Google account, even with an email identity", () => {
    expect(
      hasOAuthLogin({
        identities: [{ provider: "google" }, { provider: "email" }],
        app_metadata: { providers: ["google", "email"] },
      }),
    ).toBe(true);
  });

  it("is false for a classic email account", () => {
    expect(
      hasOAuthLogin({
        identities: [{ provider: "email" }],
        app_metadata: { providers: ["email"] },
      }),
    ).toBe(false);
  });
});

describe("hasPasswordLogin", () => {
  it("is false for a Google-only account", () => {
    expect(
      hasPasswordLogin({
        identities: [{ provider: "google" }],
        app_metadata: { providers: ["google"] },
      }),
    ).toBe(false);
  });

  it("is false when Google also has an email identity (no password to type)", () => {
    expect(
      hasPasswordLogin({
        identities: [{ provider: "google" }, { provider: "email" }],
        app_metadata: { providers: ["google", "email"] },
      }),
    ).toBe(false);
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

  it("is true for an email-only identity", () => {
    expect(
      hasPasswordLogin({
        identities: [{ provider: "email" }],
        app_metadata: { providers: ["email"] },
      }),
    ).toBe(true);
  });

  it("is false without a user", () => {
    expect(hasPasswordLogin(null)).toBe(false);
  });
});
