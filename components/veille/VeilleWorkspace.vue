<script setup lang="ts">
import type { VeilleItem, VeilleCategory, VeilleProvider } from "~/shared/veille/types";
import { VEILLE_FILTER_CHIPS, VEILLE_PROVIDER_LABELS } from "~/shared/veille/labels";
import { sortVeilleItems } from "~/shared/veille/sort";
import { feedDayGroupLabel } from "~/shared/veille/day-group";
import { formatDate } from "~/shared/lib/dates";
import {
  normalizeSnippetReferenceUrl,
  saveVeilleItemAsSnippet,
} from "~/shared/veille/to-snippet";

const props = defineProps<{
  initialItems: VeilleItem[];
  initialDay: string;
  days: string[];
}>();

const category = ref<"all" | VeilleCategory>("all");
const provider = ref<VeilleProvider | "all">("all");
const savedOnly = ref(false);
const q = ref("");
const selectedId = ref<string | null>(null);
const savingSnippetLink = ref<string | null>(null);

const client = useSupabaseClient();
const authUserId = useAuthUserId();
const { showToast } = useToast();
const { notifySnippetSaved } = useSnippetQuickAdd();

const snippetLinks = ref(
  new Set(
    props.initialItems
      .filter((i) => i.savedAsSnippet)
      .map((i) => normalizeSnippetReferenceUrl(i.link))
      .filter(Boolean),
  ),
);

const filtered = computed(() => {
  const query = q.value.trim().toLowerCase();
  let list = [...props.initialItems];

  if (category.value !== "all") list = list.filter((i) => i.category === category.value);
  if (provider.value !== "all") list = list.filter((i) => i.provider === provider.value);
  if (savedOnly.value) list = list.filter((i) => i.saved);
  if (query) {
    list = list.filter((i) =>
      `${i.title} ${i.summary} ${i.tags.join(" ")}`.toLowerCase().includes(query),
    );
  }
  return sortVeilleItems(list);
});

const groupedSections = computed(() => {
  const map = new Map<string, VeilleItem[]>();
  for (const item of filtered.value) {
    const key = item.feed_date || "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()]
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([feedDate, items]) => ({
      feedDate,
      label: feedDayGroupLabel(feedDate),
      sub: formatDate(`${feedDate}T12:00:00`, "fr", "dayMonthYear"),
      items,
    }));
});

const selected = computed(
  () =>
    filtered.value.find((i) => i.id === selectedId.value) ??
    props.initialItems.find((i) => i.id === selectedId.value) ??
    null,
);

function isSavedAsSnippet(item: VeilleItem): boolean {
  return snippetLinks.value.has(normalizeSnippetReferenceUrl(item.link));
}

async function toggleSave(item: VeilleItem) {
  const uid = authUserId.value ?? (await ensureAuthUserId());
  if (!uid) return;
  if (item.saved) {
    await client.from("veille_ia_saves").delete().eq("user_id", uid).eq("item_id", item.id);
    item.saved = false;
  } else {
    await client.from("veille_ia_saves").insert({ user_id: uid, item_id: item.id });
    item.saved = true;
  }
}

async function saveAsSnippet(item: VeilleItem) {
  if (isSavedAsSnippet(item)) return;
  const uid = authUserId.value ?? (await ensureAuthUserId());
  if (!uid) return;

  const linkKey = normalizeSnippetReferenceUrl(item.link);
  savingSnippetLink.value = linkKey;
  try {
    const result = await saveVeilleItemAsSnippet(client, uid, item, snippetLinks.value);
    if (result.status === "duplicate") {
      snippetLinks.value.add(linkKey);
      item.savedAsSnippet = true;
      showToast("Déjà sauvé");
      return;
    }
    snippetLinks.value.add(linkKey);
    item.savedAsSnippet = true;
    notifySnippetSaved();
    showToast("Ajouté aux snippets");
  } catch {
    showToast("Impossible d'ajouter le snippet");
  } finally {
    savingSnippetLink.value = null;
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <DsInput v-model="q" placeholder="Rechercher dans la veille…" aria-label="Rechercher" />

    <div class="flex flex-wrap gap-2">
      <button
        v-for="chip in VEILLE_FILTER_CHIPS"
        :key="chip.id"
        type="button"
        class="rounded-full border px-3 py-1 text-xs transition-colors"
        :class="
          category === chip.id
            ? 'border-primary/30 bg-primary text-primary-foreground'
            : 'border-border bg-card text-muted-foreground hover:text-foreground'
        "
        @click="category = chip.id"
      >
        {{ chip.label }}
      </button>
      <button
        type="button"
        class="rounded-full border px-3 py-1 text-xs"
        :class="
          savedOnly
            ? 'border-primary/30 bg-primary text-primary-foreground'
            : 'border-border bg-card text-muted-foreground'
        "
        @click="savedOnly = !savedOnly"
      >
        Enregistrés
      </button>
    </div>

    <select
      v-model="provider"
      class="max-w-xs rounded-[var(--dh-radius)] border border-border bg-card px-3 py-2 text-sm text-foreground"
      aria-label="Filtrer par éditeur"
    >
      <option value="all">Tous les éditeurs</option>
      <option v-for="(label, id) in VEILLE_PROVIDER_LABELS" :key="id" :value="id">
        {{ label }}
      </option>
    </select>

    <DsEmptyState
      v-if="filtered.length === 0"
      title="Aucun résultat"
      description="Assouplissez les filtres ou revenez demain."
    />

    <section v-for="section in groupedSections" :key="section.feedDate" class="flex flex-col gap-2 pb-2">
      <header
        class="sticky top-0 z-20 border-b border-border bg-background px-[var(--dh-space-page)] py-3 max-lg:static lg:static"
      >
        <div class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <h2 class="text-[length:var(--dh-text-base)] font-semibold capitalize leading-tight text-foreground">
            {{ section.label }}
          </h2>
          <span
            v-if="!['Aujourd\'hui', 'Hier'].includes(section.label)"
            class="text-[length:var(--dh-text-xs)] text-muted-foreground sm:text-sm"
          >
            {{ section.sub }}
          </span>
        </div>
      </header>
      <VeilleFeedRow
        v-for="item in section.items"
        :key="item.id"
        :item="item"
        :saved-as-snippet="isSavedAsSnippet(item)"
        :saving-snippet="savingSnippetLink === normalizeSnippetReferenceUrl(item.link)"
        @open="selectedId = $event"
        @save-snippet="saveAsSnippet(item)"
      />
    </section>

    <DsModal :open="Boolean(selected)" :title="selected?.title" @close="selectedId = null">
      <template v-if="selected">
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-[length:var(--dh-text-lg)] font-semibold leading-snug text-foreground">
            {{ selected.title }}
          </h2>
          <DsButton variant="ghost" size="sm" @click="selectedId = null">Fermer</DsButton>
        </div>
        <p class="mt-2 text-[length:var(--dh-text-sm)] text-muted-foreground">{{ selected.summary }}</p>
        <section v-if="selected.quoi" class="mt-4">
          <h3 class="text-[length:var(--dh-text-sm)] font-medium text-foreground">Quoi</h3>
          <ul class="mt-1 list-disc pl-5 text-[length:var(--dh-text-sm)] text-muted-foreground">
            <li v-for="(line, idx) in selected.quoi.split('\n').filter(Boolean)" :key="idx">
              {{ line.replace(/^•\s*/, "") }}
            </li>
          </ul>
        </section>
        <section v-if="selected.impact" class="mt-4">
          <h3 class="text-[length:var(--dh-text-sm)] font-medium text-foreground">Impact</h3>
          <ul class="mt-1 list-disc pl-5 text-[length:var(--dh-text-sm)] text-muted-foreground">
            <li v-for="(line, idx) in selected.impact.split('\n').filter(Boolean)" :key="idx">
              {{ line.replace(/^•\s*/, "") }}
            </li>
          </ul>
        </section>
        <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <DsButton
            variant="primary"
            size="sm"
            class="min-h-[44px] w-full sm:w-auto"
            data-testid="veille-save-snippet-detail"
            :disabled="isSavedAsSnippet(selected) || savingSnippetLink === normalizeSnippetReferenceUrl(selected.link)"
            @click="saveAsSnippet(selected)"
          >
            {{
              isSavedAsSnippet(selected)
                ? "Déjà sauvé"
                : savingSnippetLink === normalizeSnippetReferenceUrl(selected.link)
                  ? "Enregistrement…"
                  : "Sauver en snippet"
            }}
          </DsButton>
          <DsButton variant="secondary" size="sm" class="min-h-[44px] w-full sm:w-auto" @click="toggleSave(selected)">
            {{ selected.saved ? "Retirer des favoris" : "Enregistrer" }}
          </DsButton>
          <a
            :href="selected.link"
            target="_blank"
            rel="noopener noreferrer"
            class="dh-focus-ring inline-flex min-h-[44px] w-full items-center justify-center text-[length:var(--dh-text-sm)] text-primary underline sm:w-auto sm:justify-start"
          >
            Source externe
          </a>
        </div>
      </template>
    </DsModal>
  </div>
</template>
