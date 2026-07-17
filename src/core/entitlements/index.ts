import type { PlanId } from "@/core/auth/types";

/** Plan → entitlement keys. Modules gate on these. */
export const PLAN_ENTITLEMENTS: Record<PlanId, string[]> = {
  free: [],
  pro: ["module:ai"],
};

export function entitlementsForPlan(plan: PlanId | null | undefined): string[] {
  if (!plan) return PLAN_ENTITLEMENTS.free;
  return PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS.free;
}

export function hasEntitlement(
  entitlements: string[],
  required: string | null | undefined,
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
    description: "Tous les modules actifs, alertes et features avancées.",
  },
};
