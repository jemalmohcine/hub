<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>

<template>
  <div class="w-full">
    <NuxtLink
      to="/app/outils"
      class="dh-focus-ring mb-4 inline-flex items-center gap-1 text-[length:var(--dh-text-sm)] text-muted-foreground hover:text-foreground"
    >
      ← Outils
    </NuxtLink>
    <DsPageHeader compact :title="title" :description="description" />
    <slot />
  </div>
</template>
