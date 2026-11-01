import type { DevExpenseService, ServiceWithStats } from "~/shared/dev-expenses/types";

/**
 * Amount arithmetic, kept apart from `diagnose.ts` so client components can
 * display a monthly figure without pulling the provider catalog into the bundle.
 */

export function monthlyEquivalentCents(service: DevExpenseService): number {
  if (service.billingCycle === "yearly") {
    return Math.round(service.plannedAmountCents / 12);
  }
  return service.plannedAmountCents;
}

/** The amount that actually counts this month: what was logged, else the plan. */
export function effectiveMonthlyCents(service: ServiceWithStats): number {
  return service.monthAmountCents ?? monthlyEquivalentCents(service);
}

export function computeMonthlyTotals(services: ServiceWithStats[]): {
  currentMonthCents: number;
  plannedMonthlyCents: number;
  ytdCents: number;
} {
  let currentMonthCents = 0;
  let plannedMonthlyCents = 0;
  let ytdCents = 0;

  for (const s of services) {
    if (!s.isActive) continue;
    plannedMonthlyCents += monthlyEquivalentCents(s);
    ytdCents += s.ytdTotalCents;
    currentMonthCents += effectiveMonthlyCents(s);
  }

  return { currentMonthCents, plannedMonthlyCents, ytdCents };
}
