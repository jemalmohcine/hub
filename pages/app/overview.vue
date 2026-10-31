<script setup lang="ts">
import { Code2, Sparkles } from "lucide-vue-next";

const client = useSupabaseClient();
const user = useSupabaseUser();

const { data: stats, pending } = await useAsyncData(
  () => `overview-v2-${user.value?.id ?? "anon"}`,
  async () => {
    const uid = user.value?.id;
    if (!uid) return null;
    const [snippets, veille] = await Promise.all([
      client.from("dev_snippets").select("id", { count: "exact", head: true }).eq("user_id", uid),
      client.from("veille_ia_items").select("id", { count: "exact", head: true }),
    ]);
    return { snippets: snippets.count ?? 0, veille: veille.count ?? 0 };
  },
  { watch: [() => user.value?.id], server: false },
);
</script>

<template>
  <div>
    <DsPageHeader compact title="Accueil" description="Deux raccourcis, le reste en un geste.">
      <template #actions>
        <NuxtLink to="/app/ai">
          <DsButton>Ouvrir la veille</DsButton>
        </NuxtLink>
      </template>
    </DsPageHeader>

    <div v-if="pending && !stats" class="grid grid-cols-2 gap-3">
      <div class="dh-skeleton h-24" />
      <div class="dh-skeleton h-24" />
    </div>

    <div v-else class="grid grid-cols-2 gap-3">
      <DsQuickTile
        to="/app/ai"
        tone="primary"
        title="Veille IA"
        :hint="stats ? `${stats.veille} articles` : '7 derniers jours'"
        :icon="Sparkles"
      />
      <DsQuickTile
        to="/app/snippets"
        title="Snippets"
        :hint="stats ? `${stats.snippets} enregistrés` : 'Copie en 1 tap'"
        :icon="Code2"
      />
    </div>

    <section class="mt-8">
      <h2 class="mb-3 text-[length:var(--dh-text-xs)] font-semibold uppercase tracking-wide text-muted-foreground">
        Autres espaces
      </h2>
      <div class="flex flex-col gap-2">
        <NuxtLink to="/app/career" class="dh-focus-ring dh-surface flex items-center justify-between px-4 py-3">
          <span class="font-medium">Carrière</span>
          <span class="text-muted-foreground">→</span>
        </NuxtLink>
        <NuxtLink to="/app/expenses" class="dh-focus-ring dh-surface flex items-center justify-between px-4 py-3">
          <span class="font-medium">Budget outils</span>
          <span class="text-muted-foreground">→</span>
        </NuxtLink>
        <NuxtLink to="/app/settings" class="dh-focus-ring dh-surface flex items-center justify-between px-4 py-3">
          <span class="font-medium">Paramètres</span>
          <span class="text-muted-foreground">→</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
