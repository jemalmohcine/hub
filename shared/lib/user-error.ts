const BACKEND_LEAK =
  /supabase|postgrest|gotrue|pgrst|jwt|service.?role|anon.?key|postgres|realtime|storage\.object/i;

const DEFAULT_DATA =
  "Impossible de charger les données pour le moment. Réessayez dans un instant.";
const DEFAULT_AUTH = "Connexion impossible pour le moment. Réessayez.";
const DEFAULT_ACTION = "L’action a échoué. Réessayez dans un instant.";

function rawMessage(raw: unknown): string {
  if (raw instanceof Error) return raw.message;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "message" in raw) {
    return String((raw as { message: unknown }).message);
  }
  return "";
}

/** Message sûr pour les écrans (ne expose pas le backend). */
export function userFacingDataError(raw?: unknown, fallback = DEFAULT_DATA): string {
  const message = rawMessage(raw).trim();
  if (!message || BACKEND_LEAK.test(message) || message.length > 160) return fallback;
  return fallback;
}

/** Erreurs auth (magic link, OAuth) sans fuite technique. */
export function userFacingAuthError(raw?: unknown): string {
  const message = rawMessage(raw).trim().toLowerCase();
  if (!message) return DEFAULT_AUTH;
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Trop de tentatives. Patientez quelques minutes.";
  }
  if (message.includes("email") && (message.includes("invalid") || message.includes("valid"))) {
    return "Adresse e-mail invalide ou refusée.";
  }
  if (BACKEND_LEAK.test(message)) return DEFAULT_AUTH;
  if (message.length > 120) return DEFAULT_AUTH;
  return DEFAULT_AUTH;
}

export function userFacingActionError(raw?: unknown, fallback = DEFAULT_ACTION): string {
  return userFacingDataError(raw, fallback);
}
