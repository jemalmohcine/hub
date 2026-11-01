<script setup lang="ts">
const route = useRoute();
const tab = computed(() => (route.query.tab === "tools" ? "tools" : "expenses"));
</script>

<template>
  <div>
    <DsPageHeader
      title="Budget outils"
      description="Suivez vos abonnements et parcourez le catalogue d’outils."
    />
    <div class="mb-6 flex flex-wrap gap-2">
      <NuxtLink to="/app/expenses">
        <DsButton :variant="tab === 'expenses' ? 'primary' : 'secondary'" size="sm">Mes dépenses</DsButton>
      </NuxtLink>
      <NuxtLink to="/app/expenses?tab=tools">
        <DsButton :variant="tab === 'tools' ? 'primary' : 'secondary'" size="sm">Catalogue d’outils</DsButton>
      </NuxtLink>
    </div>
    <ExpensesPanel v-if="tab === 'expenses'" />
    <ExpensesToolsPanel v-else />
  </div>
</template>
