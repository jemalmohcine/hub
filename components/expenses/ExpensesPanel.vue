<script setup lang="ts">
import { userFacingDataError } from "~/shared/lib/user-error";
import { formatCurrencyCents } from "~/shared/lib/numbers";
import { computeMonthlyTotals } from "~/shared/dev-expenses/amounts";
import type { BudgetDiagnostic, ExpenseDiagnostic, ServiceWithStats } from "~/shared/dev-expenses/types";

const client = useSupabaseClient();
const user = useSupabaseUser();

const budgetDiag = ref<BudgetDiagnostic | null>(null);
const lineDiag = ref<ExpenseDiagnostic | null>(null);
const diagnosing = ref(false);

async function loadServices(uid: string): Promise<ServiceWithStats[]> {
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  const { data: services, error: sErr } = await client
    .from("dev_expense_services")
    .select("*")
    .eq("user_id", uid)
    .order("updated_at", { ascending: false });
  if (sErr) throw new Error(userFacingDataError(sErr));
  const { data: entries } = await client
    .from("dev_expense_entries")
    .select("*")
    .eq("user_id", uid)
    .gte("month", yearStart);

  return (services ?? []).map((row) => {
    const serviceEntries = (entries ?? []).filter((e) => e.service_id === row.id);
    const monthEntry = serviceEntries.find((e) => String(e.month).startsWith(month.slice(0, 7)));
    const ytdTotalCents = serviceEntries.reduce((sum, e) => sum + Number(e.amount_cents), 0);
    return {
      id: row.id as string,
      name: row.name as string,
      providerSlug: row.provider_slug as string | null,
      category: row.category as ServiceWithStats["category"],
      billingCycle: row.billing_cycle as ServiceWithStats["billingCycle"],
      plannedAmountCents: Number(row.planned_amount_cents) || 0,
      currency: (row.currency as string) || "EUR",
      websiteUrl: row.website_url as string | null,
      notes: row.notes as string | null,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      monthAmountCents: monthEntry ? Number(monthEntry.amount_cents) : null,
      ytdTotalCents,
      entryCount: serviceEntries.length,
    };
  });
}

const { data, pending, error } = await useAsyncData(
  () => `expenses-services-${user.value?.id ?? "anon"}`,
  async () => {
    const uid = user.value?.id;
    if (!uid) return { rows: [] as ServiceWithStats[], totals: computeMonthlyTotals([]) };
    const rows = await loadServices(uid);
    return { rows, totals: computeMonthlyTotals(rows) };
  },
  { watch: [() => user.value?.id], server: false },
);

async function runBudgetDiagnose() {
  diagnosing.value = true;
  try {
    budgetDiag.value = await $fetch("/api/expenses/diagnose-budget", { method: "POST" });
  } finally {
    diagnosing.value = false;
  }
}

async function runLineDiagnose(serviceId: string) {
  diagnosing.value = true;
  try {
    const diagnostic = await $fetch<ExpenseDiagnostic>("/api/expenses/diagnose-service", {
      method: "POST",
      body: { serviceId },
    });
    lineDiag.value = diagnostic;
  } finally {
    diagnosing.value = false;
  }
}
</script>

<template>
  <div>
    <p v-if="pending && !data" class="text-sm text-muted-foreground">Chargement…</p>
    <p v-if="error" class="text-sm text-destructive">{{ error.message }}</p>

    <DsCard v-if="data" class="mb-4 grid grid-cols-3 gap-2 p-4 text-center">
      <div>
        <p class="text-xs text-muted-foreground">Ce mois</p>
        <p class="font-semibold">{{ formatCurrencyCents(data.totals.currentMonthCents) }}</p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground">Prévu</p>
        <p class="font-semibold">{{ formatCurrencyCents(data.totals.plannedMonthlyCents) }}</p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground">YTD</p>
        <p class="font-semibold">{{ formatCurrencyCents(data.totals.ytdCents) }}</p>
      </div>
    </DsCard>

    <DsPageHeader compact title="Mes dépenses" description="Un bouton pour analyser tout le stack.">
      <template #actions>
        <DsButton :disabled="diagnosing" @click="runBudgetDiagnose">Analyser le budget</DsButton>
      </template>
    </DsPageHeader>

    <DsCard v-if="budgetDiag" class="mb-4 space-y-2 p-4">
      <p class="text-sm font-medium">{{ budgetDiag.headline }}</p>
      <p class="text-sm text-muted-foreground">{{ budgetDiag.summary }}</p>
      <p class="text-xs text-muted-foreground">Source : {{ budgetDiag.source === "ai" ? "IA" : "catalogue" }}</p>
    </DsCard>

    <DsCard v-if="data?.rows.length" class="divide-y divide-border">
      <div v-for="row in data.rows" :key="row.id as string" class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div>
          <p class="font-medium">{{ row.name }}</p>
          <p class="text-xs text-muted-foreground">{{ row.category }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">{{ formatCurrencyCents(row.plannedAmountCents) }}</span>
          <DsButton variant="secondary" size="sm" :disabled="diagnosing" @click="runLineDiagnose(row.id as string)">
            Diagnostiquer
          </DsButton>
        </div>
      </div>
    </DsCard>
    <DsCard v-if="lineDiag" class="mb-4 p-4">
      <p class="font-medium">{{ lineDiag.headline }}</p>
      <p class="mt-1 text-sm text-muted-foreground">{{ lineDiag.summary }}</p>
    </DsCard>
    <DsEmptyState
      v-else-if="!pending && !error"
      title="Aucune dépense"
      description="Ajoute tes abonnements SaaS pour suivre le budget mensuel."
    />
  </div>
</template>
