import { describe, expect, it } from "vitest";
import { isValidOtp, normalizeOtp, otpErrorMessage } from "@/lib/otp";

describe("normalizeOtp", () => {
  it("strips spaces", () => {
    expect(normalizeOtp("12 34 56")).toBe("123456");
  });
});

describe("isValidOtp", () => {
  it("accepts an 8-digit code", () => {
    expect(isValidOtp("49703391")).toBe(true);
  });

  it("rejects letters or a short code", () => {
    expect(isValidOtp("48a913")).toBe(false);
    expect(isValidOtp("12345")).toBe(false);
    expect(isValidOtp("")).toBe(false);
  });
});

describe("otpErrorMessage", () => {
  it("maps expired tokens to French", () => {
    expect(otpErrorMessage("Token has expired or is invalid")).toBe(
      "Code invalide ou expiré.",
    );
  });

  it("maps rate limits to French", () => {
    expect(otpErrorMessage("For security purposes, you can only request this after 60 seconds.")).toBe(
      "Attends un peu avant de renvoyer un code.",
    );
  });

  it("uses a verify fallback when the message is unknown", () => {
    expect(otpErrorMessage("something else", "verify")).toBe(
      "Impossible d’ajouter le mot de passe. Réessaie.",
    );
  });
});
