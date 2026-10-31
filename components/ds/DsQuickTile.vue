<script setup lang="ts">
import type { Component } from "vue";

defineProps<{
  to: string;
  title: string;
  hint: string;
  icon: Component;
  tone?: "primary" | "neutral";
}>();
</script>

<template>
  <NuxtLink
    :to="to"
    class="dh-quick-tile dh-focus-ring group flex min-h-[5.5rem] flex-col justify-between rounded-[var(--dh-radius-xl)] border p-4 transition-transform active:scale-[0.98]"
    :class="
      tone === 'primary'
        ? 'border-[var(--dh-accent-line)] bg-[var(--dh-accent-soft)] text-foreground'
        : 'border-border bg-card text-foreground'
    "
  >
    <span
      class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--dh-radius)]"
      :class="tone === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'"
    >
      <component :is="icon" class="h-5 w-5" aria-hidden="true" />
    </span>
    <span>
      <span class="block text-[length:var(--dh-text-base)] font-semibold leading-tight">{{ title }}</span>
      <span class="mt-0.5 block text-[length:var(--dh-text-xs)] text-muted-foreground">{{ hint }}</span>
    </span>
  </NuxtLink>
</template>
