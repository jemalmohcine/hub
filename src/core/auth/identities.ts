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

function identityProviders(user: AuthUserLike): string[] {
  const identities = user.identities ?? [];
  if (identities.length > 0) {
    return identities
      .map((identity) => identity.provider)
      .filter((provider): provider is string => Boolean(provider));
  }
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) ? providers : [];
}

/** Google / GitHub / … — these accounts never have an “old password” to type. */
export function hasOAuthLogin(user: AuthUserLike | null | undefined): boolean {
  if (!user) return false;
  return identityProviders(user).some(isOAuthProvider);
}

/**
 * True when the user can sign in with email + password and has no OAuth
 * provider. A Gmail Google account often has an `email` identity in Supabase
 * even when no password was ever set — that is not password login.
 */
export function hasPasswordLogin(user: AuthUserLike | null | undefined): boolean {
  if (!user) return false;
  if (hasOAuthLogin(user)) return false;
  return identityProviders(user).includes("email");
}
