import { getHubUser } from "@/core/auth/get-user";
import type { HubUser } from "@/core/auth/types";
import { hasEntitlement } from "@/core/entitlements";
import type { EntitlementKey } from "@/core/entitlements/keys";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Non connecté");
    this.name = "UnauthenticatedError";
  }
}

export class EntitlementRequiredError extends Error {
  readonly entitlement: EntitlementKey;

  constructor(entitlement: EntitlementKey) {
    super("Abonnement Pro requis");
    this.name = "EntitlementRequiredError";
    this.entitlement = entitlement;
  }
}

/**
 * Guard for server actions: resolves the current user or throws.
 * Replaces the per-module `assertEntitled` copies.
 */
export async function assertEntitled(
  required: EntitlementKey,
): Promise<HubUser> {
  const user = await getHubUser();
  if (!user) throw new UnauthenticatedError();
  if (!hasEntitlement(user.entitlements, required)) {
    throw new EntitlementRequiredError(required);
  }
  return user;
}

/** Guard for actions that only need an authenticated user. */
export async function assertAuthenticated(): Promise<HubUser> {
  const user = await getHubUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}
