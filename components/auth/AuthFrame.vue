<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();

const colorMode = useColorMode();
</script>

<template>
  <div class="w-full max-w-md">
    <div class="mb-6 flex items-center justify-between">
      <NuxtLink to="/" class="dh-focus-ring text-[length:var(--dh-text-base)] font-semibold">DevHub</NuxtLink>
      <DsButton
        variant="ghost"
        size="sm"
        @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
      >
        {{ colorMode.value === "dark" ? "Clair" : "Sombre" }}
      </DsButton>
    </div>
    <div class="dh-surface p-6">
      <h1 class="text-[length:var(--dh-text-xl)] font-semibold">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-[length:var(--dh-text-sm)] text-muted-foreground">
        {{ subtitle }}
      </p>
      <slot />
    </div>
  </div>
</template>
