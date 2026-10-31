"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";
import { effectiveMonthlyCents } from "@/modules/dev-expenses/amounts";
import { suggestProviderFromCatalog } from "@/modules/dev-expenses/catalog";
import {
  diagnoseBudgetLocally,
  diagnoseServiceLocally,
} from "@/modules/dev-expenses/diagnose";
import {
  llmDiagnoseBudget,
  llmDiagnoseService,
  llmIdentifyProvider,
} from "@/modules/dev-expenses/llm-advisor";
import { listDevExpenseServices } from "@/modules/dev-expenses/queries";
import {
  describeToolForPrompt,
  toAlternativeOption,
} from "@/modules/dev-expenses/tool-alternatives";
import type {
  AlternativeOption,
  BillingCycle,
  BudgetDiagnostic,
  DevExpenseService,
  ExpenseCategory,
  ExpenseDiagnostic,
  ProviderSuggestion,
  ServiceWithStats,
} from "@/modules/dev-expenses/types";
import { CATEGORY_LABELS } from "@/modules/dev-expenses/types";
import { findAlternativeTools } from "@/modules/dev-tools/queries";
import { slugify } from "@/lib/slug";

/** Every action in this file requires the expenses module. */
const requireUser = () => assertEntitled(ENTITLEMENTS.expenses);

function mapService(row: Record<string, unknown>): DevExpenseService {
  return {
    id: row.id as string,
    name: row.name as string,
    providerSlug: (row.provider_slug as string | null) ?? null,
    category: row.category as DevExpenseService["category"],
    billingCycle: row.billing_cycle as DevExpenseService["billingCycle"],
    plannedAmountCents: Number(row.planned_amount_cents) || 0,
    currency: (row.currency as string) || "EUR",
    websiteUrl: (row.website_url as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function createDevExpenseService(input: {
  name: string;
  providerSlug?: string | null;
  category: ExpenseCategory;
  billingCycle: BillingCycle;
  plannedAmountEur: number;
  websiteUrl?: string | null;
  notes?: string | null;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const cents = Math.round(input.plannedAmountEur * 100);

  const { data, error } = await supabase
    .from("dev_expense_services")
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      provider_slug: input.providerSlug?.trim() || null,
      category: input.category,
      billing_cycle: input.billingCycle,
      planned_amount_cents: cents,
      website_url: input.websiteUrl?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/expenses");
  return mapService(data as Record<string, unknown>);
}

export async function updateDevExpenseService(
  id: string,
  input: Partial<{
    name: string;
    providerSlug: string | null;
    category: ExpenseCategory;
    billingCycle: BillingCycle;
    plannedAmountEur: number;
    websiteUrl: string | null;
    notes: string | null;
    isActive: boolean;
  }>,
) {
  const user = await requireUser();
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};

  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.providerSlug !== undefined) patch.provider_slug = input.providerSlug?.trim() || null;
  if (input.category !== undefined) patch.category = input.category;
  if (input.billingCycle !== undefined) patch.billing_cycle = input.billingCycle;
  if (input.plannedAmountEur !== undefined) {
    patch.planned_amount_cents = Math.round(input.plannedAmountEur * 100);
  }
  if (input.websiteUrl !== undefined) patch.website_url = input.websiteUrl?.trim() || null;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const { data, error } = await supabase
    .from("dev_expense_services")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/expenses");
  return mapService(data as Record<string, unknown>);
}

export async function deleteDevExpenseService(id: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("dev_expense_services")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/expenses");
}

export async function upsertMonthlyEntry(input: {
  serviceId: string;
  month: string;
  amountEur: number;
  notes?: string | null;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const monthDate = input.month.slice(0, 7) + "-01";
  const cents = Math.round(input.amountEur * 100);

  const { data, error } = await supabase
    .from("dev_expense_entries")
    .upsert(
      {
        user_id: user.id,
        service_id: input.serviceId,
        month: monthDate,
        amount_cents: cents,
        notes: input.notes?.trim() || null,
      },
      { onConflict: "service_id,month" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/expenses");
  return data;
}

/**
 * Recognise a service from free text so the user only ever types a name.
 * The catalog answers when the model is unavailable or unsure.
 */
export async function suggestProvider(input: {
  name: string;
  websiteUrl?: string | null;
  notes?: string | null;
  amountEur?: number | null;
}): Promise<ProviderSuggestion | null> {
  await requireUser();

  const name = input.name.trim();
  if (name.length < 2) return null;

  const local = suggestProviderFromCatalog(name, input.websiteUrl, input.notes);

  const ai = await llmIdentifyProvider({
    name,
    websiteUrl: input.websiteUrl,
    notes: input.notes,
    amountEur: input.amountEur,
  }).catch(() => null);

  const identified = ai && ai.confidence >= 0.35 ? ai : (local ?? ai);
  if (!identified) return null;

  // Answer "et si je prenais autre chose ?" before the expense even exists.
  const tools = await findAlternativeTools({
    category: identified.category,
    excludeSlugs: [identified.providerSlug, slugify(name)].filter(Boolean),
    maxPriceEur: input.amountEur ?? identified.typicalMonthlyEur ?? null,
    limit: 3,
  }).catch(() => []);

  return { ...identified, alternatives: tools.map(toAlternativeOption) };
}

function centsToEur(cents: number): number {
  return Math.round(cents) / 100;
}

/** Diagnose one line item, with the rest of the stack as context. */
export async function diagnoseService(serviceId: string): Promise<ExpenseDiagnostic> {
  const user = await requireUser();
  const services = await listDevExpenseServices(user.id);
  const service = services.find((s) => s.id === serviceId);
  if (!service) throw new Error("Service introuvable");

  const totalCents = services
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + effectiveMonthlyCents(s), 0);
  const spendCents = effectiveMonthlyCents(service);

  const scraped = await findAlternativeTools({
    category: service.category,
    excludeSlugs: [service.providerSlug, slugify(service.name)].filter(
      (s): s is string => Boolean(s),
    ),
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

  // The model rarely knows a good alternative for niche SaaS; keep the
  // catalog's when it came back empty rather than showing nothing.
  return {
    ...ai,
    alternatives: ai.alternatives.length ? ai.alternatives : local.alternatives,
    actions: ai.actions.length ? ai.actions : local.actions,
  };
}

/**
 * One catalogue lookup per category actually present in the budget, so both
 * the offline diagnostic and the model work from the same scraped facts.
 */
async function collectCandidates(active: ServiceWithStats[]): Promise<{
  freeByCategory: Map<string, AlternativeOption>;
  promptLines: string[];
}> {
  const categories = [...new Set(active.map((s) => s.category))];
  const freeByCategory = new Map<string, AlternativeOption>();
  const promptLines: string[] = [];

  const perCategory = await Promise.all(
    categories.map(async (category) => ({
      category,
      tools: await findAlternativeTools({ category, limit: 4 }).catch(() => []),
    })),
  );

  for (const { category, tools } of perCategory) {
    if (tools.length === 0) continue;

    promptLines.push(`${CATEGORY_LABELS[category]} :`);
    for (const tool of tools) promptLines.push(describeToolForPrompt(tool));

    const free = tools.find((tool) => tool.hasFreeTier);
    if (free) freeByCategory.set(category, toAlternativeOption(free));
  }

  return { freeByCategory, promptLines };
}

/** Review the whole stack at once — duplicates and overlaps only show up there. */
export async function diagnoseBudget(): Promise<BudgetDiagnostic> {
  const user = await requireUser();
  const services = await listDevExpenseServices(user.id);
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
