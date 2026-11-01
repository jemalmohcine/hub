<script setup lang="ts">
const { hubUser } = useHubUser();
const client = useSupabaseClient();
const router = useRouter();

const currentPassword = ref("");
const newPassword = ref("");
const error = ref("");
const ok = ref("");

async function changePassword() {
  error.value = "";
  ok.value = "";
  const { error: err } = await client.auth.updateUser({ password: newPassword.value });
  if (err) {
    error.value = err.message;
    return;
  }
  ok.value = "Mot de passe mis à jour.";
  currentPassword.value = "";
  newPassword.value = "";
}

async function signOut() {
  await client.auth.signOut();
  router.push("/auth/login");
}
</script>

<template>
  <div>
    <DsSettingsBack />
    <DsPageHeader title="Sécurité" description="Mot de passe, session et accès à ton compte." />
    <DsCard v-if="hubUser" class="mb-4 space-y-2 p-4">
      <p class="text-sm"><span class="text-muted-foreground">E-mail :</span> {{ hubUser.email }}</p>
      <p class="text-sm capitalize"><span class="text-muted-foreground">Rôle :</span> {{ hubUser.profile.role }}</p>
    </DsCard>
    <DsCard class="mb-4 space-y-3 p-4">
      <h2 class="font-medium">Changer le mot de passe</h2>
      <DsInput v-model="newPassword" type="password" autocomplete="new-password" placeholder="Nouveau mot de passe" />
      <DsButton @click="changePassword">Mettre à jour</DsButton>
      <p v-if="ok" class="text-sm text-success">{{ ok }}</p>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    </DsCard>
    <DsCard class="p-4">
      <DsButton variant="danger" @click="signOut">Se déconnecter</DsButton>
    </DsCard>
  </div>
</template>
