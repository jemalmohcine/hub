/** Email OTP / reauthentication nonce from Supabase. Length is not advertised in the UI. */
const OTP_RE = /^\d{6,8}$/;

export function normalizeOtp(value: string): string {
  return value.replace(/\s/g, "").trim();
}

export function isValidOtp(value: string): boolean {
  return OTP_RE.test(normalizeOtp(value));
}

export function otpErrorMessage(
  message: string | undefined,
  kind: "send" | "verify" = "send",
): string {
  const m = (message ?? "").toLowerCase();
  if (
    m.includes("rate") ||
    m.includes("too many") ||
    m.includes("security purposes") ||
    m.includes("only request this after")
  ) {
    return "Attends un peu avant de renvoyer un code.";
  }
  if (
    m.includes("invalid") ||
    m.includes("expired") ||
    m.includes("otp") ||
    m.includes("token") ||
    m.includes("nonce")
  ) {
    return "Code invalide ou expiré.";
  }
  return kind === "verify"
    ? "Impossible d’ajouter le mot de passe. Réessaie."
    : "Impossible d’envoyer le code. Réessaie.";
}
