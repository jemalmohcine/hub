<script setup lang="ts">
import { profileFullName } from "~/shared/core/auth/types";

const { hubUser, pending } = useHubUser();
const client = useSupabaseClient();
const message = ref("");

const firstName = ref("");
const lastName = ref("");
const displayName = ref("");

watch(
  hubUser,
  (u) => {
    if (!u) return;
    firstName.value = u.profile.first_name ?? "";
    lastName.value = u.profile.last_name ?? "";
    displayName.value = u.profile.display_name ?? "";
  },
  { immediate: true },
);

async function save() {
  if (!hubUser.value) return;
  message.value = "";
  const { error } = await client
    .from("profiles")
    .update({
      first_name: firstName.value.trim() || null,
      last_name: lastName.value.trim() || null,
      display_name: displayName.value.trim() || null,
    })
    .eq("id", hubUser.value.id);
  message.value = error ? "Enregistrement impossible." : "Profil enregistré.";
}
</script>

<template>
  <div>
    <DsSettingsBack />
    <DsPageHeader title="Compte" description="Prénom, nom et identité affichée dans le hub." />
    <DsCard v-if="hubUser" class="space-y-3 p-4">
      <DsInput v-model="firstName" placeholder="Prénom" />
      <DsInput v-model="lastName" placeholder="Nom" />
      <DsInput v-model="displayName" placeholder="Nom affiché" />
      <p class="text-[length:var(--dh-text-xs)] text-muted-foreground">E-mail : {{ hubUser.email }}</p>
      <DsButton @click="save">Enregistrer</DsButton>
      <p v-if="message" class="text-sm text-success">{{ message }}</p>
    </DsCard>
    <DsEmptyState v-else-if="!pending" title="Session requise" description="Reconnecte-toi pour modifier ton compte." />
    <p v-if="hubUser" class="mt-4 text-[length:var(--dh-text-xs)] text-muted-foreground">
      Affiché comme {{ profileFullName(hubUser.profile) || "Non renseigné" }}.
    </p>
  </div>
</template>
