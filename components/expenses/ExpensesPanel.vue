<script setup lang="ts">
import { userFacingDataError } from "~/shared/lib/user-error";

const client = useSupabaseClient();
const user = useSupabaseUser();

const { data, pending, error } = await useAsyncData(
  () => `expenses-services-${user.value?.id ?? "anon"}`,
  async () => {
    const uid = user.value?.id;
    if (!uid) return [];
    const { data: rows, error: qErr } = await client
      .from("dev_expense_services")
      .select("id, name, category, planned_amount_cents, currency, billing_cycle, is_active")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    if (qErr) throw new Error(userFacingDataError(qErr));
    return rows ?? [];
  },
  { watch: [() => user.value?.id], server: false },
);
</script>

<template>
  <div>
    <p v-if="pending && !data" class="text-sm text-muted-foreground">Chargement…</p>
    <p v-if="error" class="text-sm text-destructive" role="alert">{{ error.message }}</p>
    <DsCard v-if="data?.length" class="divide-y divide-border">
      <div v-for="row in data" :key="row.id as string" class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div>
          <p class="font-medium text-foreground">{{ row.name }}</p>
          <p class="text-xs text-muted-foreground">{{ row.category }} · {{ row.billing_cycle }}</p>
        </div>
        <p class="text-sm font-medium">
          {{ ((Number(row.planned_amount_cents) || 0) / 100).toFixed(2) }} {{ row.currency || "EUR" }}
        </p>
      </div>
    </DsCard>
    <DsEmptyState
      v-else-if="!pending && !error"
      title="Aucune dépense"
      description="Ajoutez vos abonnements SaaS pour suivre le budget mensuel."
    />
  </div>
</template>
