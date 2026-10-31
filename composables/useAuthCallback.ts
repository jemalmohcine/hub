import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailOtpType } from "@supabase/supabase-js";

export function authConfirmPath(next?: string): string {
  const path = "/auth/confirm";
  if (!next || next === "/app/overview") return path;
  return `${path}?next=${encodeURIComponent(next)}`;
}

/** Absolute URL for e-mail links (confirmation, recovery). */
export function authRedirectUrl(appUrl: string, path: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Finish sign-in from the URL after an e-mail link or OAuth redirect.
 * Handles PKCE ?code=, verify ?token_hash=, and implicit hash sessions.
 */
export async function completeAuthFromUrl(client: SupabaseClient): Promise<{ ok: true } | { ok: false; reason: string }> {
  const route = useRoute();

  const code = typeof route.query.code === "string" ? route.query.code : null;
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return { ok: false, reason: "exchange" };
    return { ok: true };
  }

  const tokenHash = typeof route.query.token_hash === "string" ? route.query.token_hash : null;
  const otpType = typeof route.query.type === "string" ? route.query.type : null;
  if (tokenHash && otpType) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as EmailOtpType,
    });
    if (error) return { ok: false, reason: "otp" };
    return { ok: true };
  }

  const { data, error } = await client.auth.getSession();
  if (error) return { ok: false, reason: "session" };
  if (data.session) return { ok: true };

  return { ok: false, reason: "no_session" };
}

export async function waitForAuthUser(timeoutMs = 8000): Promise<boolean> {
  const user = useSupabaseUser();
  if (user.value) return true;

  return new Promise((resolve) => {
    const stop = watch(user, (value) => {
      if (value) {
        stop();
        clearTimeout(timer);
        resolve(true);
      }
    });
    const timer = window.setTimeout(() => {
      stop();
      resolve(!!user.value);
    }, timeoutMs);
  });
}

export const AUTH_CALLBACK_TIMEOUT_MS = 12_000;

export function authCallbackFailureMessage(reason: string): string {
  if (reason === "no_session") {
    return "Lien expiré ou déjà utilisé. Demandez un nouveau lien ou reconnectez-vous.";
  }
  return "Impossible de finaliser la connexion. Réessayez depuis la page de connexion.";
}
