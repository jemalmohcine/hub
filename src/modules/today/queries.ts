import type { HubUser } from "@/core/auth/types";
import { hasEntitlement, ENTITLEMENTS } from "@/core/entitlements";
import { daysBetween } from "@/lib/dates";
import { aiIntelItemHref } from "@/modules/ai-intel/item-link";
import { getAiIntelFeed, getLatestAiIntelRun } from "@/modules/ai-intel/queries";
import { isHotAlert } from "@/modules/ai-intel/ui/rank";
import { computeMonthlyTotals, listDevExpenseServices } from "@/modules/dev-expenses/queries";
import { listJobListings } from "@/modules/job-board/queries";
import { listJobApplications } from "@/modules/job-tracker/queries";
import type { TodayDigest, TodayHighlight, TodaySignal } from "@/modules/today/types";
import { formatCurrencyCents } from "@/lib/numbers";

/** A listing scraped within this window counts as "new" on the board. */
const NEW_LISTING_DAYS = 3;
const MAX_HIGHLIGHTS = 3;

const TONE_ORDER = { urgent: 0, attention: 1, neutral: 2 } as const;

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

async function aiSignals(userId: string): Promise<{
  signal: TodaySignal | null;
  highlights: TodayHighlight[];
}> {
  const items = await getAiIntelFeed(userId, {}).catch(() => []);
  const alerts = items.filter((item) => isHotAlert(item) && !item.read);

  if (alerts.length === 0) return { signal: null, highlights: [] };

  return {
    signal: {
      id: "ai-alerts",
      module: "ai",
      tone: "urgent",
      label: `${alerts.length} ${plural(alerts.length, "alerte urgente", "alertes urgentes")}`,
      detail: "Sécurité, prix, dépréciation ou repo qui explose.",
      href: "/app/ai",
    },
    highlights: alerts.slice(0, MAX_HIGHLIGHTS).map((item) => ({
      id: item.id,
      title: item.title,
      source: item.primary_source,
      href: aiIntelItemHref(item.id),
    })),
  };
}

async function jobSignals(userId: string): Promise<TodaySignal[]> {
  const [listings, applications] = await Promise.all([
    listJobListings("all").catch(() => []),
    listJobApplications(userId).catch(() => []),
  ]);

  const signals: TodaySignal[] = [];

  const fresh = listings.filter(
    (listing) => daysBetween(listing.scrapedAt) < NEW_LISTING_DAYS,
  );
  if (fresh.length > 0) {
    signals.push({
      id: "jobs-new",
      module: "jobs",
      tone: "neutral",
      label: `${fresh.length} ${plural(fresh.length, "nouvelle offre", "nouvelles offres")}`,
      detail: `Collectées ces ${NEW_LISTING_DAYS} derniers jours.`,
      href: "/app/career?tab=offers",
    });
  }

  const dueFollowUps = applications.filter(
    (application) =>
      application.followUpAt !== null && daysBetween(application.followUpAt) >= 0,
  );
  if (dueFollowUps.length > 0) {
    signals.push({
      id: "jobs-followups",
      module: "jobs",
      tone: "attention",
      label: `${dueFollowUps.length} ${plural(dueFollowUps.length, "relance à faire", "relances à faire")}`,
      detail: dueFollowUps
        .slice(0, 3)
        .map((application) => application.company)
        .join(", "),
      href: "/app/career?tab=jobs",
    });
  }

  return signals;
}

async function expenseSignal(userId: string): Promise<TodaySignal | null> {
  const services = await listDevExpenseServices(userId).catch(() => []);
  if (services.length === 0) return null;

  const totals = computeMonthlyTotals(services);
  return {
    id: "expenses-month",
    module: "expenses",
    tone: "neutral",
    label: `${formatCurrencyCents(totals.plannedMonthlyCents)} / mois`,
    detail: `${services.length} ${plural(services.length, "service actif", "services actifs")} dans ta stack.`,
    href: "/app/expenses",
  };
}

/**
 * Everything a developer needs to see on opening the app, in one query.
 * Locked modules are skipped so free users never see empty Pro rows.
 */
export async function getTodayDigest(user: HubUser): Promise<TodayDigest> {
  const canAi = hasEntitlement(user.entitlements, ENTITLEMENTS.ai);
  const canJobs = hasEntitlement(user.entitlements, ENTITLEMENTS.jobs);
  const canExpenses = hasEntitlement(user.entitlements, ENTITLEMENTS.expenses);

  const [ai, jobs, expenses, lastRun] = await Promise.all([
    canAi ? aiSignals(user.id) : Promise.resolve({ signal: null, highlights: [] }),
    canJobs ? jobSignals(user.id) : Promise.resolve([]),
    canExpenses ? expenseSignal(user.id) : Promise.resolve(null),
    canAi ? getLatestAiIntelRun().catch(() => null) : Promise.resolve(null),
  ]);

  const signals = [ai.signal, ...jobs, expenses]
    .filter((signal): signal is TodaySignal => signal !== null)
    .sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);

  return {
    signals,
    highlights: ai.highlights,
    lastRunAt: lastRun?.finished_at ?? null,
    allClear: signals.every((signal) => signal.tone === "neutral"),
  };
}
