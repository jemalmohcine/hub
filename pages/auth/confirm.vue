<script setup lang="ts">
definePageMeta({ layout: "auth" });

const user = useSupabaseUser();
const route = useRoute();

watchEffect(() => {
  if (user.value) {
    const next =
      typeof route.query.next === "string" ? route.query.next : "/app/overview";
    navigateTo(next);
  }
});
</script>

<template>
  <p class="text-sm text-muted-foreground">Connexion en cours…</p>
</template>
