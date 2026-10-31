<script setup lang="ts">
import { userFacingAuthError, userFacingDataError } from "~/shared/lib/user-error";

const client = useSupabaseClient();
const authUserId = useAuthUserId();
const authEmail = useAuthUserEmail();
const colorMode = useColorMode();
const router = useRouter();

const displayName = ref("");
const avatarUrl = ref("");
const locale = ref("fr");
const message = ref("");
const error = ref("");
const loading = ref(false);

const { data: profile, refresh } = await useAsyncData(
  () => `settings-${authUserId.value ?? "anon"}`,
  async () => {
    await waitForAuthUserId();
    const uid = authUserId.value;
    if (!uid) return null;
    const { data: row, error: pErr } = await client
      .from("profiles")
      .select("display_name, avatar_url, email")
      .eq("id", uid)
      .maybeSingle();
    if (pErr) throw new Error(userFacingDataError(pErr));

    const { data: prefs } = await client
      .from("user_preferences")
      .select("locale")
      .eq("user_id", uid)
      .maybeSingle();

    return {
      displayName: (row?.display_name as string) ?? "",
      avatarUrl: (row?.avatar_url as string) ?? "",
      email: (row?.email as string) ?? authEmail.value ?? "",
      locale: (prefs?.locale as string) ?? "fr",
    };
  },
  { watch: [authUserId], server: false },
);

watch(
  profile,
  (p) => {
    if (!p) return;
    displayName.value = p.displayName;
    avatarUrl.value = p.avatarUrl;
    locale.value = p.locale;
  },
  { immediate: true },
);

async function saveProfile() {
  const uid = authUserId.value;
  if (!uid) return;
  loading.value = true;
  error.value = "";
  message.value = "";
  const { error: pErr } = await client
    .from("profiles")
    .update({
      display_name: displayName.value.trim() || null,
      avatar_url: avatarUrl.value.trim() || null,
    })
    .eq("id", uid);
  const { error: prefErr } = await client
    .from("user_preferences")
    .update({ locale: locale.value })
    .eq("user_id", uid);
  loading.value = false;
  if (pErr || prefErr) {
    error.value = userFacingDataError(pErr ?? prefErr);
    return;
  }
  message.value = "Profil enregistré.";
  await refresh();
}

async function signOut() {
  await client.auth.signOut();
  await router.push("/auth/login");
}

async function deleteAccount() {
  const ok = window.confirm(
    "Cette action est définitive. Toutes vos données seront supprimées. Continuer ?",
  );
  if (!ok) return;
  error.value =
    "Suppression de compte : contactez le support ou exécutez la procédure admin. Déconnexion effectuée.";
  await signOut();
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6">
    <DsPageHeader
      title="Paramètres"
      description="Compte, sécurité et apparence."
      :pending="!profile && Boolean(authUserId)"
    />

    <DsCard v-if="profile" class="space-y-4 p-5">
      <h2 class="text-sm font-semibold text-foreground">Profil</h2>
      <label class="block text-xs font-medium text-muted-foreground">
        Nom affiché
        <DsInput v-model="displayName" class="mt-1" placeholder="Votre nom" />
      </label>
      <label class="block text-xs font-medium text-muted-foreground">
        Photo (URL)
        <DsInput v-model="avatarUrl" class="mt-1" placeholder="https://…" />
      </label>
      <label class="block text-xs font-medium text-muted-foreground">
        E-mail
        <DsInput :model-value="profile.email" class="mt-1" disabled />
      </label>
      <label class="block text-xs font-medium text-muted-foreground">
        Langue
        <select
          v-model="locale"
          class="mt-1 w-full rounded-[var(--dh-radius)] border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </label>
      <DsButton :disabled="loading" @click="saveProfile">Enregistrer</DsButton>
    </DsCard>

    <DsCard class="space-y-3 p-5">
      <h2 class="text-sm font-semibold text-foreground">Apparence</h2>
      <DsButton
        variant="secondary"
        @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
      >
        Thème {{ colorMode.value === "dark" ? "clair" : "sombre" }}
      </DsButton>
    </DsCard>

    <DsCard class="space-y-3 p-5">
      <h2 class="text-sm font-semibold text-foreground">Sécurité</h2>
      <NuxtLink to="/auth/forgot-password" class="text-sm text-primary underline">
        Changer le mot de passe
      </NuxtLink>
      <DsButton variant="secondary" class="w-full" @click="signOut">Déconnexion</DsButton>
    </DsCard>

    <DsCard class="space-y-3 border-destructive/30 p-5">
      <h2 class="text-sm font-semibold text-destructive">Zone sensible</h2>
      <p class="text-xs text-muted-foreground">
        La suppression du compte nécessite une validation côté serveur.
      </p>
      <DsButton variant="danger" @click="deleteAccount">Supprimer mon compte</DsButton>
    </DsCard>

    <p v-if="message" class="text-sm text-success" role="status">{{ message }}</p>
    <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
  </div>
</template>
