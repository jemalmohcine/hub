<script setup lang="ts">
const { modules } = useHubModules();
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-16">
    <header class="text-center">
      <p class="text-sm font-medium text-primary">DevHub</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Ton hub dev, propre et rapide
      </h1>
      <p class="mx-auto mt-3 max-w-xl text-muted-foreground">
        Veille IA, snippets, CV, offres gratuites — un seul espace pour le quotidien de dev.
      </p>
      <div class="mt-8 flex justify-center gap-3">
        <NuxtLink to="/auth/login">
          <DsButton>Se connecter</DsButton>
        </NuxtLink>
        <NuxtLink to="/app/overview">
          <DsButton variant="secondary">Ouvrir l’app</DsButton>
        </NuxtLink>
      </div>
    </header>
    <div class="mt-16 grid gap-4 sm:grid-cols-2">
      <DsCard v-for="mod in modules" :key="mod.id" class="p-5">
        <h2 class="font-semibold">{{ mod.label }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ mod.description }}</p>
      </DsCard>
    </div>
  </div>
</template>
