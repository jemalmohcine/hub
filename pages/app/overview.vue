<script setup lang="ts">
const { modules } = useHubModules();
const tiles = computed(() => modules.filter((m) => m.id !== "overview"));
</script>

<template>
  <div>
    <DsPageHeader title="Tableau de bord" description="Accédez rapidement à chaque module." />
    <div class="grid gap-3 sm:grid-cols-2">
      <NuxtLink v-for="mod in tiles" :key="mod.id" :to="mod.href">
        <DsCard class="p-4 transition-colors hover:border-primary/40">
          <h2 class="font-medium">{{ mod.label }}</h2>
          <p class="text-sm text-muted-foreground">{{ mod.description }}</p>
        </DsCard>
      </NuxtLink>
    </div>
  </div>
</template>
