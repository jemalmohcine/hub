<template>
  <ShellAppShell v-if="showAppShell">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ShellAppShell>
  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>
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

const themeColor = computed(() => (colorMode.value === "dark" ? "#0e0c12" : "#f7f5f2"));

useHead({
  meta: [
    { name: "dh-build", content: config.public.buildSha as string },
    { name: "dh-framework", content: config.public.buildFramework as string },
    { name: "theme-color", content: () => themeColor.value, key: "theme-color-active" },
    {
      name: "theme-color",
      content: "#f7f5f2",
      media: "(prefers-color-scheme: light)",
      key: "theme-color-light",
    },
    {
      name: "theme-color",
      content: "#0e0c12",
      media: "(prefers-color-scheme: dark)",
      key: "theme-color-dark",
    },
  ],
});

watchEffect(() => {
  if (import.meta.client) {
    document.documentElement.classList.toggle("dark", colorMode.value === "dark");
  }
});
</script>
