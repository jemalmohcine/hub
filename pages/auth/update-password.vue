<script setup lang="ts">
definePageMeta({ layout: "auth" });

import { userFacingAuthError } from "~/shared/lib/user-error";
import {
  AUTH_CALLBACK_TIMEOUT_MS,
  authCallbackFailureMessage,
  completeAuthFromUrl,
  waitForAuthUser,
} from "~/composables/useAuthCallback";

const client = useSupabaseClient();
const user = useSupabaseUser();

const password = ref("");
const passwordConfirm = ref("");
const error = ref("");
const loading = ref(false);
const ready = ref(false);

function redirectToLogin(message: string) {
  navigateTo({ path: "/auth/login", query: { error: message } }, { replace: true });
}

onMounted(async () => {
  const timeoutId = window.setTimeout(() => {
    if (!ready.value) {
      redirectToLogin(
        "Le lien a expiré. Demandez un nouveau mot de passe depuis la page dédiée.",
      );
    }
  }, AUTH_CALLBACK_TIMEOUT_MS);

  try {
    const result = await completeAuthFromUrl(client);
    if (!result.ok) {
      redirectToLogin(authCallbackFailureMessage(result.reason));
      return;
    }
    const ok = await waitForAuthUser(8000);
    if (!ok && !user.value) {
      redirectToLogin(authCallbackFailureMessage("no_session"));
      return;
    }
    ready.value = true;
  } catch (err) {
    redirectToLogin(userFacingAuthError(err));
  } finally {
    window.clearTimeout(timeoutId);
  }
});

async function savePassword() {
  error.value = "";
  if (password.value.length < 8) {
    error.value = "Le mot de passe doit contenir au moins 8 caractères.";
    return;
  }
  if (password.value !== passwordConfirm.value) {
    error.value = "Les mots de passe ne correspondent pas.";
    return;
  }
  loading.value = true;
  const { error: err } = await client.auth.updateUser({ password: password.value });
  loading.value = false;
  if (err) {
    error.value = userFacingAuthError(err);
    return;
  }
  await navigateTo("/app/overview");
}
</script>

<template>
  <AuthFrame
    title="Nouveau mot de passe"
    subtitle="Choisissez un mot de passe pour votre compte."
  >
    <form v-if="ready" class="mt-6 space-y-3" @submit.prevent="savePassword">
      <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
        Nouveau mot de passe
        <DsInput
          v-model="password"
          type="password"
          autocomplete="new-password"
          placeholder="8 caractères minimum"
          class="mt-1"
        />
      </label>
      <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
        Confirmer
        <DsInput
          v-model="passwordConfirm"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
          class="mt-1"
        />
      </label>
      <DsButton type="submit" class="w-full" :disabled="loading || !password">
        <DsSpinner v-if="loading" />
        <span v-else>Enregistrer</span>
      </DsButton>
    </form>
    <p v-else class="mt-4 text-[length:var(--dh-text-sm)] text-muted-foreground" role="status">
      Vérification du lien en cours…
    </p>
    <p v-if="error" class="mt-4 text-[length:var(--dh-text-sm)] text-destructive" role="alert">{{ error }}</p>
  </AuthFrame>
</template>
