<script setup lang="ts">
const route = useRoute();

const useAppShell = computed(
  () => route.path.startsWith("/app") || route.path === "/admin",
);
</script>

<template>
  <AppShell v-if="useAppShell">
    <slot />
  </AppShell>
  <slot v-else />
</template>
