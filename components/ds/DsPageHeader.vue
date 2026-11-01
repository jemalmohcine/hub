<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  pending?: boolean;
  error?: string | null;
  compact?: boolean;
}>();
</script>

<template>
  <header class="mb-6" :class="compact ? 'mb-4' : ''">
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
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h1 class="dh-page-title">{{ title }}</h1>
        <p v-if="description" class="mt-1 max-w-prose text-[length:var(--dh-text-sm)] leading-relaxed text-muted-foreground">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
