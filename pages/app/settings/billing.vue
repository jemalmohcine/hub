<script setup lang="ts">
import { PLAN_META } from "~/shared/core/entitlements/index";
import { formatDate } from "~/shared/lib/dates";

const { hubUser } = useHubUser();
const client = useSupabaseClient();
const message = ref("");

const plan = computed(() => hubUser.value?.subscription?.plan ?? "free");

async function setPlan(next: "free" | "pro") {
  const uid = hubUser.value?.id;
  if (!uid) return;
  const { error } = await client.from("subscriptions").upsert({
    user_id: uid,
    plan: next,
    status: "active",
  });
  message.value = error ? "Impossible de changer le plan." : `Plan ${PLAN_META[next].label} appliqué (sans paiement).`;
}
</script>

<template>
  <div>
    <DsSettingsBack />
    <DsPageHeader title="Abonnement" description="Ton plan actuel et les options disponibles." />
    <DsCard v-if="hubUser" class="mb-4 space-y-2 p-4">
      <p class="text-sm">
        Plan :
        <strong class="capitalize">{{ PLAN_META[plan].label }}</strong>
        · {{ PLAN_META[plan].priceLabel }}
      </p>
      <p v-if="hubUser.subscription?.current_period_end" class="text-sm text-muted-foreground">
        Période jusqu’au {{ formatDate(hubUser.subscription.current_period_end, "fr", "short") }}
      </p>
    </DsCard>
    <DsCard class="space-y-2 p-4">
      <p class="text-sm text-muted-foreground">Aucun paiement réel pour l’instant.</p>
      <div class="flex flex-wrap gap-2">
        <DsButton variant="secondary" size="sm" @click="setPlan('free')">Free</DsButton>
        <DsButton size="sm" @click="setPlan('pro')">Pro (test)</DsButton>
      </div>
      <p v-if="message" class="text-sm text-success">{{ message }}</p>
    </DsCard>
  </div>
</template>
