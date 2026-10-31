import type { PlanId } from "@/core/auth/types";
import { ENTITLEMENTS, type EntitlementKey } from "@/core/entitlements/keys";

export { ENTITLEMENTS, ALL_ENTITLEMENTS } from "@/core/entitlements/keys";
export type { EntitlementKey } from "@/core/entitlements/keys";

/** Plan → entitlement keys. Modules gate on these. */
export const PLAN_ENTITLEMENTS: Record<PlanId, EntitlementKey[]> = {
  free: [],
  pro: [
    ENTITLEMENTS.ai,
    ENTITLEMENTS.cv,
    ENTITLEMENTS.jobs,
    ENTITLEMENTS.snippets,
    ENTITLEMENTS.expenses,
  ],
};

export function entitlementsForPlan(
  plan: PlanId | null | undefined,
): EntitlementKey[] {
  if (!plan) return PLAN_ENTITLEMENTS.free;
  return PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS.free;
}

export function hasEntitlement(
  entitlements: readonly string[],
  required: EntitlementKey | null | undefined,
): boolean {
  if (!required) return true;
  return entitlements.includes(required);
}

export const PLAN_META: Record<
  PlanId,
  { label: string; priceLabel: string; description: string }
> = {
  free: {
    label: "Free",
    priceLabel: "0 €",
    description: "Overview, settings, aperçu des modules à venir.",
  },
  pro: {
    label: "Pro",
    priceLabel: "19 € / mois",
    description:
      "Tous les modules actifs (AI, CV, Candidatures, Snippets, Dépenses), alertes et features avancées.",
  },
};
