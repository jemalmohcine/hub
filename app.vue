<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
watchEffect(() => {
  if (import.meta.client) {
    document.documentElement.classList.toggle("dark", colorMode.value === "dark");
  }
});
</script>
