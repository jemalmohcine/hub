<script setup lang="ts">
definePageMeta({ layout: "auth" });

const client = useSupabaseClient();
const route = useRoute();
const config = useRuntimeConfig();
const email = ref("");
const message = ref("");
const error = ref("");
const loading = ref(false);
const colorMode = useColorMode();

async function signInEmail() {
  loading.value = true;
  message.value = "";
  error.value = "";
  const redirectTo = `${config.public.appUrl}/auth/confirm`;
  const { error: err } = await client.auth.signInWithOtp({
    email: email.value.trim(),
    options: { emailRedirectTo: redirectTo },
  });
  loading.value = false;
  if (err) error.value = err.message;
  else message.value = "Lien envoyé — vérifie ta boîte mail.";
}

async function signInGithub() {
  error.value = "";
  const next = typeof route.query.next === "string" ? route.query.next : "/app/overview";
  const { error: err } = await client.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${config.public.appUrl}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (err) error.value = err.message;
}
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
        {{ colorMode.value === 'dark' ? 'Clair' : 'Sombre' }}
      </DsButton>
    </div>
    <div class="dh-surface p-6">
      <h1 class="text-[length:var(--dh-text-xl)] font-semibold">Connexion</h1>
      <p class="mt-1 text-[length:var(--dh-text-sm)] text-muted-foreground">
        Accès gratuit à ton hub — données sur ton projet Supabase.
      </p>
      <form class="mt-6 space-y-3" @submit.prevent="signInEmail">
        <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
          Email
          <DsInput v-model="email" type="email" placeholder="toi@exemple.com" class="mt-1" />
        </label>
        <DsButton type="submit" class="w-full" :disabled="loading || !email.trim()">
          <DsSpinner v-if="loading" />
          <span v-else>Recevoir un lien magique</span>
        </DsButton>
      </form>
      <div class="my-4 flex items-center gap-3 text-[length:var(--dh-text-xs)] text-muted-foreground">
        <span class="h-px flex-1 bg-border" />
        ou
        <span class="h-px flex-1 bg-border" />
      </div>
      <DsButton variant="secondary" class="w-full" @click="signInGithub">
        Continuer avec GitHub
      </DsButton>
      <p v-if="message" class="mt-4 text-[length:var(--dh-text-sm)] text-success" role="status">{{ message }}</p>
      <p v-if="error" class="mt-4 text-[length:var(--dh-text-sm)] text-destructive" role="alert">{{ error }}</p>
    </div>
  </div>
</template>
