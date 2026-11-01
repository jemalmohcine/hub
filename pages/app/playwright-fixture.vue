<script setup lang="ts">
const config = useRuntimeConfig();
if (!config.public.e2eShell) {
  await navigateTo("/404");
}
</script>

<template>
  <p data-testid="fixture-body" class="text-sm text-muted-foreground">Fixture Playwright shell.</p>
</template>
