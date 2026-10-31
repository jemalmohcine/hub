<script setup lang="ts">
definePageMeta({ layout: "auth" });

import { userFacingAuthError } from "~/shared/lib/user-error";

const client = useSupabaseClient();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

onMounted(() => {
  const q = route.query.error;
  if (typeof q === "string" && q.trim()) {
    error.value = q.trim();
  }
});

function resolveNext(): string {
  return typeof route.query.next === "string" ? route.query.next : "/app/overview";
}

async function signIn() {
  loading.value = true;
  message.value = "";
  error.value = "";
  const { error: err } = await client.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  });
  loading.value = false;
  if (err) {
    error.value = userFacingAuthError(err);
    return;
  }
  await router.push(resolveNext());
}
</script>

<template>
  <AuthFrame
    title="Connexion"
    subtitle="Accès gratuit. Vos données restent sur votre espace personnel."
  >
    <form class="mt-6 space-y-3" @submit.prevent="signIn">
      <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
        E-mail
        <DsInput v-model="email" type="email" autocomplete="email" placeholder="vous@entreprise.com" class="mt-1" />
      </label>
      <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
        Mot de passe
        <DsInput
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          class="mt-1"
        />
      </label>
      <DsButton type="submit" class="w-full" :disabled="loading || !email.trim() || !password">
        <DsSpinner v-if="loading" />
        <span v-else>Se connecter</span>
      </DsButton>
    </form>
    <p class="mt-4 text-center text-[length:var(--dh-text-sm)]">
      <NuxtLink to="/auth/forgot-password" class="text-primary underline">Mot de passe oublié</NuxtLink>
    </p>
    <p class="mt-4 text-center text-[length:var(--dh-text-sm)] text-muted-foreground">
      Pas encore de compte ?
      <NuxtLink :to="{ path: '/auth/sign-up', query: route.query }" class="text-primary underline">
        Créer un compte
      </NuxtLink>
    </p>
    <p v-if="error" class="mt-4 text-[length:var(--dh-text-sm)] text-destructive" role="alert">{{ error }}</p>
  </AuthFrame>
</template>
