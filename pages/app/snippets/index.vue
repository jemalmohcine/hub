<script setup lang="ts">
import type { DevSnippet } from "~/shared/snippets/types";
import { rankSnippets } from "~/shared/snippets/match";
import { loadSnippetsWorkspace } from "~/shared/snippets/queries";
import { userFacingDataError } from "~/shared/lib/user-error";

definePageMeta({ ssr: false });

const route = useRoute();
const client = useSupabaseClient();
const authUserId = useAuthUserId();
const { openQuickAdd, refreshTick } = useSnippetQuickAdd();

const copiedId = ref<string | null>(null);
const q = ref(typeof route.query.q === "string" ? route.query.q : "");
const categoryId = ref<string | null>(null);
const editId = ref<string | null>(null);

function onCopied(id: string) {
  copiedId.value = id;
  setTimeout(() => {
    if (copiedId.value === id) copiedId.value = null;
  }, 2000);
}

const { data, pending, error, refresh } = await useAsyncData(
  () => `snippets-${authUserId.value ?? "anon"}`,
  async () => {
    const uid = await ensureAuthUserId();
    if (!uid) return null;
    try {
      return await loadSnippetsWorkspace(client, uid);
    } catch (e) {
      throw new Error(userFacingDataError(e));
    }
  },
  { watch: [() => authUserId.value], server: false },
);

watch(refreshTick, () => {
  void refresh();
});

watch(
  () => authUserId.value,
  (uid) => {
    if (uid) void refresh();
  },
);

const filtered = computed(() => {
  let list = data.value?.snippets ?? [];
  if (categoryId.value) list = list.filter((s) => s.categoryId === categoryId.value);
  if (q.value.trim()) {
    const ranked = rankSnippets(list, q.value.trim());
    const order = new Map(ranked.map((r, i) => [r.id, i]));
    list = [...list].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }
  return list;
});

const editingSnippet = computed(
  () =>
    filtered.value.find((s) => s.id === editId.value) ??
    data.value?.snippets.find((s) => s.id === editId.value) ??
    null,
);

async function createCategory() {
  const uid = authUserId.value ?? (await ensureAuthUserId());
  if (!uid) return;
  const name = window.prompt("Nom du dossier");
  if (!name?.trim()) return;
  await client.from("dev_snippet_categories").insert({ user_id: uid, name: name.trim() });
  await refresh();
}

function onEditSaved() {
  editId.value = null;
  void refresh();
}
</script>

<template>
  <div>
    <DsPageHeader compact title="Snippets" description="Toucher une carte pour copier. N ou Ajouter pour créer.">
      <template #actions>
        <DsButton size="sm" type="button" @click="openQuickAdd">Ajouter</DsButton>
      </template>
    </DsPageHeader>

    <p v-if="error" class="mb-4 text-[length:var(--dh-text-sm)] text-destructive">{{ error.message }}</p>

    <DsInput
      v-if="!error && data"
      v-model="q"
      placeholder="Rechercher…"
      class="mb-4 max-w-md"
      aria-label="Rechercher snippets"
    />

    <div v-if="!error && data" class="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-full border px-3 py-1 text-xs"
        :class="!categoryId ? 'border-primary/30 bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'"
        @click="categoryId = null"
      >
        Tous
      </button>
      <button
        v-for="cat in data.categories"
        :key="cat.id"
        type="button"
        class="rounded-full border px-3 py-1 text-xs"
        :class="
          categoryId === cat.id
            ? 'border-primary/30 bg-primary text-primary-foreground'
            : 'border-border bg-card text-muted-foreground'
        "
        @click="categoryId = cat.id"
      >
        {{ cat.name }}
      </button>
      <DsButton variant="ghost" size="sm" @click="createCategory">+ Dossier</DsButton>
    </div>

    <div v-if="pending && !data" class="dh-skeleton h-40" />

    <DsEmptyState
      v-else-if="!error && data && filtered.length === 0"
      title="Aucun snippet"
      description="Appuyez sur Ajouter ou sur le bouton + pour enregistrer du code."
    />

    <SnippetList
      v-else-if="!error && data && filtered.length > 0"
      :snippets="filtered"
      :selected-id="editId"
      :copied-id="copiedId"
      @copy="onCopied"
      @edit="editId = $event"
    />

    <DsSheet :open="Boolean(editingSnippet)" title="Modifier le snippet" @close="editId = null">
      <SnippetEditor
        v-if="editingSnippet"
        :snippet="editingSnippet"
        @saved="onEditSaved"
        @deleted="onEditSaved"
      />
    </DsSheet>
  </div>
</template>
