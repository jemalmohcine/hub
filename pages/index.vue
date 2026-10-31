<script setup lang="ts">
const { modules } = useHubModules();
const colorMode = useColorMode();
</script>

<template>
  <div class="landing-glow min-h-dvh">
    <header class="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
      <span class="text-[length:var(--dh-text-base)] font-semibold tracking-tight">DevHub</span>
      <DsButton
        variant="ghost"
        size="sm"
        @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
      >
        {{ colorMode.value === 'dark' ? 'Clair' : 'Sombre' }}
      </DsButton>
    </header>

    <div class="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:pt-16">
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-[length:var(--dh-text-xs)] font-medium uppercase tracking-widest text-primary">
          Plateforme pour développeurs
        </p>
        <h1 class="mt-3 text-[length:var(--dh-text-2xl)] font-semibold tracking-tight sm:text-4xl sm:leading-tight">
          Veille, snippets, CV et avantages gratuits
        </h1>
        <p class="mx-auto mt-4 max-w-lg text-[length:var(--dh-text-base)] text-muted-foreground">
          Un espace unique pour votre quotidien technique. Gratuit, synchronisé en ligne, pensé pour le clavier.
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <NuxtLink to="/auth/login">
            <DsButton>Se connecter</DsButton>
          </NuxtLink>
          <NuxtLink to="/auth/sign-up">
            <DsButton variant="secondary">Créer un compte</DsButton>
          </NuxtLink>
        </div>
        <p class="mt-4 text-[length:var(--dh-text-xs)] text-muted-foreground">
          E-mail et mot de passe · raccourci <kbd class="rounded border border-border px-1 font-mono">⌘K</kbd> dans l’app
        </p>
      </div>

      <div class="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="mod in modules" :key="mod.id" class="dh-surface p-5 transition-transform hover:-translate-y-0.5">
          <h2 class="text-[length:var(--dh-text-base)] font-semibold">{{ mod.label }}</h2>
          <p class="mt-2 text-[length:var(--dh-text-sm)] leading-relaxed text-muted-foreground">
            {{ mod.description }}
          </p>
        </article>
      </div>
    </div>
  </div>
</template>
