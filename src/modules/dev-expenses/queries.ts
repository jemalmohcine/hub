import { createClient } from "@/core/auth/supabase/server";
import {
  effectiveMonthlyCents,
  monthlyEquivalentCents,
} from "@/modules/dev-expenses/diagnose";
import type {
  DevExpenseEntry,
  DevExpenseService,
  ServiceWithStats,
} from "@/modules/dev-expenses/types";

function currentMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

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

function mapEntry(row: Record<string, unknown>): DevExpenseEntry {
  return {
    id: row.id as string,
    serviceId: row.service_id as string,
    month: row.month as string,
    amountCents: Number(row.amount_cents) || 0,
    currency: (row.currency as string) || "EUR",
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function listDevExpenseServices(userId: string): Promise<ServiceWithStats[]> {
  const supabase = await createClient();
  const month = currentMonthIso();
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const { data: services, error } = await supabase
    .from("dev_expense_services")
    .select("*")
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error || !services) return [];

  const { data: entries } = await supabase
    .from("dev_expense_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("month", yearStart);

  const entryList = (entries ?? []).map((e) => mapEntry(e as Record<string, unknown>));

  return services.map((row) => {
    const service = mapService(row as Record<string, unknown>);
    const serviceEntries = entryList.filter((e) => e.serviceId === service.id);
    const monthEntry = serviceEntries.find((e) => e.month.startsWith(month.slice(0, 7)));
    const ytdTotalCents = serviceEntries.reduce((sum, e) => sum + e.amountCents, 0);

    return {
      ...service,
      monthAmountCents: monthEntry?.amountCents ?? null,
      ytdTotalCents,
      entryCount: serviceEntries.length,
    };
  });
}

export async function listDevExpenseEntries(
  userId: string,
  serviceId?: string,
): Promise<DevExpenseEntry[]> {
  const supabase = await createClient();
  let query = supabase
    .from("dev_expense_entries")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: false })
    .limit(120);

  if (serviceId) query = query.eq("service_id", serviceId);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => mapEntry(row as Record<string, unknown>));
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
