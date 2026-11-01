<script setup lang="ts">
import { Code2, Sparkles, Wrench } from "lucide-vue-next";
import type { VeilleItem } from "~/shared/veille/types";
import { filterClientVeilleItems } from "~/shared/veille/client-filter";
import { filterVeilleLastSevenDays } from "~/shared/veille/days";
import { mapVeilleRow } from "~/shared/veille/map-row";
import { sortVeilleItems } from "~/shared/veille/sort";

const client = useSupabaseClient();
const authUserId = useAuthUserId();
const { showToast } = useToast();

const { data, pending } = await useAsyncData(
  () => `overview-feed-${authUserId.value ?? "anon"}`,
  async () => {
    const uid = await ensureAuthUserId();

    const [snippetListRes, snippetCountRes, veilleRes] = await Promise.all([
      uid
        ? client
            .from("dev_snippets")
            .select("id, title, language, content, updated_at")
            .eq("user_id", uid)
            .order("updated_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      uid
        ? client.from("dev_snippets").select("id", { count: "exact", head: true }).eq("user_id", uid)
        : Promise.resolve({ count: 0, error: null }),
      client.from("veille_ia_items").select("*").order("feed_date", { ascending: false }).limit(120),
    ]);

    const snippets = (snippetListRes.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      language: row.language as string | null,
      content: row.content as string,
    }));

    const veilleRows = filterClientVeilleItems(
      (veilleRes.data ?? []).map((row) => mapVeilleRow(row as Record<string, unknown>)),
    );
    const veilleRecent = sortVeilleItems(filterVeilleLastSevenDays(veilleRows)).slice(0, 5);

    return {
      snippetTotal: snippetCountRes.count ?? snippets.length,
      snippets,
      veilleRecent: veilleRecent as VeilleItem[],
      veilleCount: filterVeilleLastSevenDays(veilleRows).length,
    };
  },
  { watch: [() => authUserId.value], server: false },
);

async function copySnippet(snippet: { title: string; content: string }) {
  try {
    await navigator.clipboard.writeText(snippet.content);
    showToast(`« ${snippet.title} » copié`);
  } catch {
    showToast("Copie impossible");
  }
}
</script>

<template>
  <div>
    <DsPageHeader compact title="Accueil" description="Veille, snippets, outils du quotidien. ⌘K pour naviguer." />

    <div v-if="pending && !data" class="grid grid-cols-2 gap-3">
      <div class="dh-skeleton h-24" />
      <div class="dh-skeleton h-24" />
    </div>

    <div v-else class="grid grid-cols-2 gap-3">
      <DsQuickTile
        to="/app/ai"
        tone="primary"
        title="Veille IA"
        :hint="data ? `${data.veilleCount} sur 7 jours` : '7 derniers jours'"
        :icon="Sparkles"
      />
      <DsQuickTile
        to="/app/snippets"
        title="Snippets"
        :hint="data ? `${data.snippetTotal} enregistrés` : 'Copie en 1 tap'"
        :icon="Code2"
      />
      <DsQuickTile to="/app/outils" title="Outils" hint="JSON, JWT, regex, couleurs…" :icon="Wrench" />
    </div>

    <section v-if="data?.veilleRecent.length" class="mt-8">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h2 class="text-[length:var(--dh-text-xs)] font-semibold uppercase tracking-wide text-muted-foreground">
          Veille récente
        </h2>
        <NuxtLink to="/app/ai" class="text-[length:var(--dh-text-xs)] text-primary">Tout voir</NuxtLink>
      </div>
      <ul class="flex flex-col gap-2">
        <li v-for="item in data.veilleRecent" :key="item.id">
          <NuxtLink :to="`/app/ai`" class="dh-focus-ring dh-surface block px-4 py-3">
            <p class="line-clamp-2 text-[length:var(--dh-text-sm)] font-medium leading-snug">{{ item.title }}</p>
            <p class="mt-1 text-[length:var(--dh-text-xs)] text-muted-foreground">{{ item.summary }}</p>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="data?.snippets.length" class="mt-8">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h2 class="text-[length:var(--dh-text-xs)] font-semibold uppercase tracking-wide text-muted-foreground">
          Snippets récents
        </h2>
        <NuxtLink to="/app/snippets" class="text-[length:var(--dh-text-xs)] text-primary">Bibliothèque</NuxtLink>
      </div>
      <ul class="flex flex-col gap-2">
        <li v-for="snippet in data.snippets" :key="snippet.id">
          <button
            type="button"
            class="dh-focus-ring dh-surface flex w-full flex-col gap-1 px-4 py-3 text-left"
            @click="copySnippet(snippet)"
          >
            <span class="flex items-center justify-between gap-2">
              <span class="truncate font-medium">{{ snippet.title }}</span>
              <DsBadge tone="neutral">{{ snippet.language || "text" }}</DsBadge>
            </span>
            <span class="line-clamp-1 font-mono text-[length:var(--dh-text-xs)] text-muted-foreground">
              {{ snippet.content }}
            </span>
          </button>
        </li>
      </ul>
    </section>

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
