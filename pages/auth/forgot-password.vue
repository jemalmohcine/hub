<script setup lang="ts">
definePageMeta({ layout: "auth" });

import { userFacingAuthError } from "~/shared/lib/user-error";
import { authRedirectUrl } from "~/composables/useAuthCallback";

const client = useSupabaseClient();
const config = useRuntimeConfig();

const email = ref("");
const message = ref("");
const error = ref("");
const loading = ref(false);
const sent = ref(false);

async function sendReset() {
  loading.value = true;
  message.value = "";
  error.value = "";
  const redirectTo = authRedirectUrl(config.public.appUrl, "/auth/update-password");
  const { error: err } = await client.auth.resetPasswordForEmail(email.value.trim(), {
    redirectTo,
  });
  loading.value = false;
  if (err) {
    error.value = userFacingAuthError(err);
    return;
  }
  sent.value = true;
  message.value = "Si cette adresse existe, vous recevrez un e-mail pour choisir un nouveau mot de passe.";
}
</script>

<template>
  <AuthFrame
    title="Mot de passe oublié"
    subtitle="Nous vous enverrons un lien sécurisé par e-mail."
  >
    <form v-if="!sent" class="mt-6 space-y-3" @submit.prevent="sendReset">
      <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
        E-mail
        <DsInput v-model="email" type="email" autocomplete="email" placeholder="vous@entreprise.com" class="mt-1" />
      </label>
      <DsButton type="submit" class="w-full" :disabled="loading || !email.trim()">
        <DsSpinner v-if="loading" />
        <span v-else>Envoyer le lien</span>
      </DsButton>
    </form>
    <div v-else class="mt-6 space-y-4">
      <p class="text-[length:var(--dh-text-sm)] text-muted-foreground" role="status">{{ message }}</p>
      <NuxtLink to="/auth/login">
        <DsButton variant="secondary" class="w-full">Retour à la connexion</DsButton>
      </NuxtLink>
    </div>
    <p v-if="!sent" class="mt-4 text-center text-[length:var(--dh-text-sm)]">
      <NuxtLink to="/auth/login" class="text-primary underline">Retour à la connexion</NuxtLink>
    </p>
    <p v-if="error" class="mt-4 text-[length:var(--dh-text-sm)] text-destructive" role="alert">{{ error }}</p>
  </AuthFrame>
</template>
