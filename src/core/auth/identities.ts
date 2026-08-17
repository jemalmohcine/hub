type IdentityLike = {
  provider?: string;
};

type AuthUserLike = {
  identities?: IdentityLike[] | null;
  app_metadata?: {
    providers?: string[];
  } | null;
};

/**
 * True when the user can sign in with email + password.
 * Google/GitHub-only accounts get this after `updateUser({ password })`.
 */
export function hasPasswordLogin(user: AuthUserLike | null | undefined): boolean {
  if (!user) return false;
  const identities = user.identities ?? [];
  if (identities.some((identity) => identity.provider === "email")) {
    return true;
  }
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("email");
}
