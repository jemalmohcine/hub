<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <SnippetQuickAddSheet v-if="showAppShell" />
  </ClientOnly>
  <Teleport to="body">
    <p v-if="toastMessage" class="dh-toast" role="status">{{ toastMessage }}</p>
  </Teleport>
</template>

<script setup lang="ts">
const route = useRoute();
const colorMode = useColorMode();
const { toastMessage } = useToast();
const config = useRuntimeConfig();

const showAppShell = computed(
  () => route.path.startsWith("/app") || route.path === "/admin",
);

useHead({
  meta: [
    { name: "dh-build", content: config.public.buildSha as string },
    { name: "dh-framework", content: config.public.buildFramework as string },
  ],
});

watchEffect(() => {
  if (import.meta.client) {
    document.documentElement.classList.toggle("dark", colorMode.value === "dark");
  }
});
</script>
