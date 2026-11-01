<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <SnippetQuickAddSheet />
  </ClientOnly>
  <Teleport to="body">
    <p v-if="toastMessage" class="dh-toast" role="status">{{ toastMessage }}</p>
  </Teleport>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const { toastMessage } = useToast();
watchEffect(() => {
  if (import.meta.client) {
    document.documentElement.classList.toggle("dark", colorMode.value === "dark");
  }
});
</script>
