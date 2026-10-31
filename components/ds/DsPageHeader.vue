<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  pending?: boolean;
  error?: string | null;
}>();
</script>

<template>
  <header class="mb-6">
    <div v-if="pending" class="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
      <DsSpinner />
      <span>Chargement…</span>
    </div>
    <div
      v-else-if="error"
      class="mb-3 rounded-[var(--dh-radius)] border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      {{ error }}
    </div>
    <h1 class="dh-page-title text-foreground">{{ title }}</h1>
    <p v-if="description" class="mt-1 text-[length:var(--dh-text-sm)] text-muted-foreground">
      {{ description }}
    </p>
  </header>
</template>
