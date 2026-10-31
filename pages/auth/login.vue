<script setup lang="ts">
definePageMeta({ layout: "auth" });

const client = useSupabaseClient();
const route = useRoute();
const email = ref("");
const message = ref("");
const loading = ref(false);

async function signInEmail() {
  loading.value = true;
  message.value = "";
  const redirectTo = `${useRuntimeConfig().public.appUrl}/auth/confirm`;
  const { error } = await client.auth.signInWithOtp({
    email: email.value.trim(),
    options: { emailRedirectTo: redirectTo },
  });
  loading.value = false;
  message.value = error
    ? error.message
    : "Lien envoyé — vérifie ta boîte mail.";
}

async function signInGithub() {
  const next = typeof route.query.next === "string" ? route.query.next : "/app/overview";
  await client.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${useRuntimeConfig().public.appUrl}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
}
</script>

<template>
  <DsCard class="w-full max-w-md p-6">
    <h1 class="text-xl font-semibold">Connexion</h1>
    <p class="mt-1 text-sm text-muted-foreground">Hub gratuit pour ton usage dev.</p>
    <form class="mt-6 space-y-3" @submit.prevent="signInEmail">
      <DsInput v-model="email" type="email" placeholder="Email" />
      <DsButton type="submit" class="w-full" :disabled="loading || !email.trim()">
        Lien magique
      </DsButton>
    </form>
    <DsButton variant="secondary" class="mt-3 w-full" @click="signInGithub">
      Continuer avec GitHub
    </DsButton>
    <p v-if="message" class="mt-4 text-sm text-muted-foreground">{{ message }}</p>
  </DsCard>
</template>
