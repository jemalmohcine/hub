<script setup lang="ts">
const { hubUser } = useHubUser();
const client = useSupabaseClient();
const colorMode = useColorMode();
const locale = ref("fr");
const message = ref("");

watch(
  () => hubUser.value?.preferences?.locale,
  (l) => {
    if (l) locale.value = l;
  },
  { immediate: true },
);

async function saveLocale() {
  const uid = hubUser.value?.id;
  if (!uid) return;
  const { error } = await client.from("user_preferences").upsert({ user_id: uid, locale: locale.value });
  message.value = error ? "Erreur." : "Préférences enregistrées.";
}
</script>

<template>
  <div>
    <DsSettingsBack />
    <DsPageHeader title="Langue et apparence" description="Langue, thème et notifications." />
    <div class="flex flex-col gap-4">
      <PushEnableCard />
      <DsCard class="space-y-3 p-4">
        <label class="block text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">
          Langue
          <select
            v-model="locale"
            class="mt-1 w-full rounded-[var(--dh-radius-lg)] border border-border bg-card px-3 py-2"
            @change="saveLocale"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
        <DsButton variant="secondary" @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'">
          Thème {{ colorMode.value === "dark" ? "clair" : "sombre" }}
        </DsButton>
        <p v-if="message" class="text-sm text-success">{{ message }}</p>
      </DsCard>
    </div>
  </div>
</template>
