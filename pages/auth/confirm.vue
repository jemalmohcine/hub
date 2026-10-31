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
const route = useRoute();

const phase = ref<"working" | "done">("working");
const detail = ref("Finalisation de votre connexion…");

function redirectToLogin(message: string) {
  navigateTo(
    {
      path: "/auth/login",
      query: { error: message },
    },
    { replace: true },
  );
}

onMounted(async () => {
  if (user.value) {
    const next =
      typeof route.query.next === "string" ? route.query.next : "/app/overview";
    await navigateTo(next, { replace: true });
    return;
  }

  const timeoutId = window.setTimeout(() => {
    if (phase.value === "working") {
      redirectToLogin(
        "La connexion a pris trop de temps. Réessayez avec votre e-mail et votre mot de passe.",
      );
    }
  }, AUTH_CALLBACK_TIMEOUT_MS);

  try {
    const result = await completeAuthFromUrl(client);
    if (!result.ok) {
      redirectToLogin(authCallbackFailureMessage(result.reason));
      return;
    }

    const ready = await waitForAuthUser(8000);
    if (!ready) {
      redirectToLogin(authCallbackFailureMessage("no_session"));
      return;
    }

    phase.value = "done";
    const next =
      typeof route.query.next === "string" ? route.query.next : "/app/overview";
    await navigateTo(next, { replace: true });
  } catch (err) {
    redirectToLogin(userFacingAuthError(err));
  } finally {
    window.clearTimeout(timeoutId);
  }
});
</script>

<template>
  <AuthFrame title="Connexion" subtitle="Un instant pendant que nous vérifions votre accès.">
    <p class="mt-4 text-[length:var(--dh-text-sm)] text-muted-foreground" role="status">
      {{ detail }}
    </p>
  </AuthFrame>
</template>
