type IdentityLike = {
  provider?: string;
};

type AuthUserLike = {
  identities?: IdentityLike[] | null;
  app_metadata?: {
    providers?: string[];
  } | null;
};

const OAUTH_PROVIDERS = new Set([
  "google",
  "github",
  "apple",
  "azure",
  "facebook",
  "twitter",
  "discord",
  "gitlab",
  "bitbucket",
]);

function isOAuthProvider(provider: string | undefined): boolean {
  return Boolean(provider && OAUTH_PROVIDERS.has(provider));
}

/**
 * True when the user can sign in with email + password.
 * Google/GitHub-only accounts get this after `updateUser({ password })`.
 *
 * Do not trust `app_metadata.providers` containing `"email"`: Supabase often
 * lists it for OAuth users who only have an email address, not a password.
 */
export function hasPasswordLogin(user: AuthUserLike | null | undefined): boolean {
  if (!user) return false;

  const identities = user.identities ?? [];
  if (identities.length > 0) {
    return identities.some((identity) => identity.provider === "email");
  }

  const providers = user.app_metadata?.providers;
  if (!Array.isArray(providers) || providers.length === 0) return false;
  if (providers.some(isOAuthProvider)) return false;
  return providers.includes("email");
}
