<script setup lang="ts">
const { modules } = useHubModules();
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Bonjour</h1>
    <p class="mt-1 text-muted-foreground">Accès rapide à tes modules.</p>
    <div class="mt-8 grid gap-3 sm:grid-cols-2">
      <NuxtLink v-for="mod in modules" :key="mod.id" :to="mod.href">
        <DsCard class="p-4 transition-colors hover:border-primary/40">
          <h2 class="font-medium">{{ mod.label }}</h2>
          <p class="text-sm text-muted-foreground">{{ mod.description }}</p>
        </DsCard>
      </NuxtLink>
    </div>
  </div>
</template>
