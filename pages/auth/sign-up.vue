<script setup lang="ts">
definePageMeta({ layout: "auth" });

import { userFacingAuthError } from "~/shared/lib/user-error";
import { authConfirmPath, authRedirectUrl } from "~/composables/useAuthCallback";

const client = useSupabaseClient();
const config = useRuntimeConfig();

const email = ref("");
const password = ref("");
const passwordConfirm = ref("");
const message = ref("");
const error = ref("");
const loading = ref(false);
const done = ref(false);

async function signUp() {
  error.value = "";
  message.value = "";
  if (password.value.length < 8) {
    error.value = "Le mot de passe doit contenir au moins 8 caractères.";
    return;
  }
  if (password.value !== passwordConfirm.value) {
    error.value = "Les mots de passe ne correspondent pas.";
    return;
  }

  loading.value = true;
  const redirectTo = authRedirectUrl(
    config.public.appUrl,
    authConfirmPath("/app/overview"),
  );
  const { data, error: err } = await client.auth.signUp({
    email: email.value.trim(),
    password: password.value,
    options: { emailRedirectTo: redirectTo },
  });
  loading.value = false;

  if (err) {
    error.value = userFacingAuthError(err);
    return;
  }

  if (data.session) {
    await navigateTo("/app/overview");
    return;
  }

  done.value = true;
  message.value = "Vérifiez votre e-mail pour activer votre compte.";
}
</script>

<template>
  <AuthFrame
    title="Créer un compte"
    subtitle="Inscription gratuite pour accéder à DevHub."
  >
    <form v-if="!done" class="mt-6 space-y-3" @submit.prevent="signUp">
      <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
        E-mail
        <DsInput v-model="email" type="email" autocomplete="email" placeholder="vous@entreprise.com" class="mt-1" />
      </label>
      <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
        Mot de passe
        <DsInput
          v-model="password"
          type="password"
          autocomplete="new-password"
          placeholder="8 caractères minimum"
          class="mt-1"
        />
      </label>
      <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
        Confirmer le mot de passe
        <DsInput
          v-model="passwordConfirm"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
          class="mt-1"
        />
      </label>
      <DsButton type="submit" class="w-full" :disabled="loading || !email.trim() || !password">
        <DsSpinner v-if="loading" />
        <span v-else>S’inscrire</span>
      </DsButton>
    </form>
    <div v-else class="mt-6 space-y-4">
      <p class="text-[length:var(--dh-text-sm)] text-success" role="status">{{ message }}</p>
      <p class="text-[length:var(--dh-text-sm)] text-muted-foreground">
        Ouvrez le lien reçu par e-mail pour accéder à l’application.
      </p>
      <NuxtLink to="/auth/login">
        <DsButton variant="secondary" class="w-full">Retour à la connexion</DsButton>
      </NuxtLink>
    </div>
    <p v-if="!done" class="mt-4 text-center text-[length:var(--dh-text-sm)] text-muted-foreground">
      Déjà inscrit ?
      <NuxtLink to="/auth/login" class="text-primary underline">Se connecter</NuxtLink>
    </p>
    <p v-if="error" class="mt-4 text-[length:var(--dh-text-sm)] text-destructive" role="alert">{{ error }}</p>
  </AuthFrame>
</template>
