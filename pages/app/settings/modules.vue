<script setup lang="ts">
import { getSortedModules } from "~/shared/core/module-registry";
import { hasEntitlement } from "~/shared/core/entitlements";

const { hubUser } = useHubUser();
const modules = getSortedModules();
const unlocked = computed(
  () =>
    hubUser.value
      ? modules.filter((m) => hasEntitlement(hubUser.value!.entitlements, m.requiredEntitlement)).length
      : 0,
);
</script>

<template>
  <div>
    <DsSettingsBack />
    <DsPageHeader
      :title="'Modules'"
      :description="hubUser ? `${unlocked} / ${modules.length} accessibles avec ton plan.` : ''"
    />
    <div class="flex flex-col gap-3">
      <DsCard v-for="mod in modules" :key="mod.id" class="p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold">{{ mod.label }}</h3>
            <p class="mt-1 text-sm text-muted-foreground">{{ mod.description }}</p>
          </div>
          <DsBadge tone="success">Actif</DsBadge>
        </div>
        <NuxtLink :to="mod.href" class="mt-3 inline-block">
          <DsButton variant="secondary" size="sm">Ouvrir</DsButton>
        </NuxtLink>
      </DsCard>
    </div>
  </div>
</template>
