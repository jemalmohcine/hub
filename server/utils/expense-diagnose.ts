import type { SupabaseClient } from "@supabase/supabase-js";
import { effectiveMonthlyCents } from "~/shared/dev-expenses/amounts";
import { diagnoseBudgetLocally, diagnoseServiceLocally } from "~/shared/dev-expenses/diagnose";
import { llmDiagnoseBudget, llmDiagnoseService } from "~/shared/dev-expenses/llm-advisor";
import type { AlternativeOption, BudgetDiagnostic, ExpenseDiagnostic, ServiceWithStats } from "~/shared/dev-expenses/types";
import { CATEGORY_LABELS } from "~/shared/dev-expenses/types";
import { describeToolForPrompt, toAlternativeOption } from "~/shared/dev-expenses/tool-alternatives";
import { findAlternativeTools } from "~/server/utils/dev-tools/queries";
import { listDevExpenseServicesForUser } from "~/server/utils/expense-queries";
import { slugify } from "~/shared/lib/slug";

function centsToEur(cents: number): number {
  return Math.round(cents) / 100;
}

export async function runDiagnoseService(
  supabase: SupabaseClient,
  userId: string,
  serviceId: string,
): Promise<ExpenseDiagnostic> {
  const services = await listDevExpenseServicesForUser(supabase, userId);
  const service = services.find((s) => s.id === serviceId);
  if (!service) throw createError({ statusCode: 404, statusMessage: "Service introuvable" });

  const totalCents = services.filter((s) => s.isActive).reduce((sum, s) => sum + effectiveMonthlyCents(s), 0);
  const spendCents = effectiveMonthlyCents(service);

  const scraped = await findAlternativeTools({
    category: service.category,
    excludeSlugs: [service.providerSlug, slugify(service.name)].filter((s): s is string => Boolean(s)),
    maxPriceEur: centsToEur(spendCents) || null,
  }).catch(() => []);

  const local = diagnoseServiceLocally(
    service,
    spendCents,
    totalCents,
    scraped.map(toAlternativeOption),
  );

  const ai = await llmDiagnoseService({
    service,
    monthlySpendEur: centsToEur(spendCents),
    shareOfBudgetPct: local.shareOfBudgetPct,
    totalMonthlyEur: centsToEur(totalCents),
    otherServices: services
      .filter((s) => s.isActive && s.id !== serviceId)
      .map((s) => ({
        name: s.name,
        category: CATEGORY_LABELS[s.category],
        monthlyEur: centsToEur(effectiveMonthlyCents(s)),
      })),
    candidates: scraped.map(describeToolForPrompt),
  }).catch(() => null);

  if (!ai) return local;
  return {
    ...ai,
    alternatives: ai.alternatives.length ? ai.alternatives : local.alternatives,
    actions: ai.actions.length ? ai.actions : local.actions,
  };
}

async function collectCandidates(active: ServiceWithStats[]) {
  const categories = [...new Set(active.map((s) => s.category))];
  const freeByCategory = new Map<string, AlternativeOption>();
  const promptLines: string[] = [];

  for (const category of categories) {
    const tools = await findAlternativeTools({ category, limit: 4 }).catch(() => []);
    if (tools.length === 0) continue;
    promptLines.push(`${CATEGORY_LABELS[category]} :`);
    for (const tool of tools) promptLines.push(describeToolForPrompt(tool));
    const free = tools.find((tool) => tool.hasFreeTier);
    if (free) freeByCategory.set(category, toAlternativeOption(free));
  }

  return { freeByCategory, promptLines };
}

export async function runDiagnoseBudget(
  supabase: SupabaseClient,
  userId: string,
): Promise<BudgetDiagnostic> {
  const services = await listDevExpenseServicesForUser(supabase, userId);
  const active = services.filter((s) => s.isActive);
  const { freeByCategory, promptLines } = await collectCandidates(active);
  const local = diagnoseBudgetLocally(services, freeByCategory);
  if (active.length === 0) return local;

  const totalCents = active.reduce((sum, s) => sum + effectiveMonthlyCents(s), 0);
  const ytdCents = active.reduce((sum, s) => sum + s.ytdTotalCents, 0);

  const ai = await llmDiagnoseBudget({
    services: active.map((s) => ({
      name: s.name,
      category: CATEGORY_LABELS[s.category],
      billingCycle: s.billingCycle,
      monthlyEur: centsToEur(effectiveMonthlyCents(s)),
      notes: s.notes,
    })),
    totalMonthlyEur: centsToEur(totalCents),
    ytdEur: centsToEur(ytdCents),
    candidates: promptLines,
  }).catch(() => null);

  return ai ?? local;
}
