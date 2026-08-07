"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";
import type {
  BillingCycle,
  DevExpenseService,
  ExpenseCategory,
} from "@/modules/dev-expenses/types";

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
