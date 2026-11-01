<template>
  <div id="dh-app-root">
    <AppShell v-if="showAppShell">
      <NuxtPage />
    </AppShell>
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
    <SnippetQuickAddSheet v-if="showAppShell" />
    <Teleport to="body">
      <p v-if="toastMessage" class="dh-toast" role="status">{{ toastMessage }}</p>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const colorMode = useColorMode();
const { toastMessage } = useToast();

const showAppShell = computed(
  () => route.path.startsWith("/app") || route.path === "/admin",
);

watchEffect(() => {
  if (import.meta.client) {
    document.documentElement.classList.toggle("dark", colorMode.value === "dark");
  }
});
</script>
