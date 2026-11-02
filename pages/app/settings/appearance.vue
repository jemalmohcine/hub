<script setup lang="ts">
definePageMeta({ ssr: false });

const { hubUser } = useHubUser();
const client = useSupabaseClient();
const { preference, setPreference, isDark } = useHubColorMode();
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

const themeOptions = [
  { id: "light" as const, label: "Clair" },
  { id: "dark" as const, label: "Sombre" },
  { id: "auto" as const, label: "Système" },
];
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
        <div>
          <p class="text-[length:var(--dh-text-xs)] font-medium text-muted-foreground">Thème</p>
          <div class="mt-2 flex flex-wrap gap-2" data-testid="theme-preference">
            <DsButton
              v-for="opt in themeOptions"
              :key="opt.id"
              size="sm"
              :variant="preference === opt.id ? 'primary' : 'secondary'"
              :data-testid="`theme-option-${opt.id}`"
              @click="setPreference(opt.id)"
            >
              {{ opt.label }}
            </DsButton>
          </div>
          <p class="mt-2 text-[length:var(--dh-text-xs)] text-muted-foreground">
            {{ isDark ? "Mode sombre actif." : "Mode clair actif." }}
            <span v-if="preference === 'auto'"> (réglage système)</span>
          </p>
        </div>
        <p v-if="message" class="text-sm text-success">{{ message }}</p>
      </DsCard>
    </div>
  </div>
</template>
