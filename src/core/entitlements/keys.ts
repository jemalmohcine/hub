/**
 * Single source of truth for entitlement keys.
 * Modules, pages, and server actions gate on these instead of raw strings.
 */
export const ENTITLEMENTS = {
  ai: "module:ai",
  cv: "module:cv",
  jobs: "module:jobs",
  snippets: "module:snippets",
  expenses: "module:expenses",
} as const;

export type EntitlementKey = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];

export const ALL_ENTITLEMENTS: readonly EntitlementKey[] =
  Object.values(ENTITLEMENTS);
