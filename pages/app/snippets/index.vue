<script setup lang="ts">
import type { DevSnippet, DevSnippetCategory } from "~/shared/snippets/types";
import { rankSnippets } from "~/shared/snippets/match";
import { userFacingDataError } from "~/shared/lib/user-error";

const route = useRoute();
const client = useSupabaseClient();
const user = useSupabaseUser();
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
  () => `snippets-${user.value?.id ?? "anon"}`,
  async () => {
    const uid = user.value?.id;
    if (!uid) return null;

    const { data: cats, error: cErr } = await client
      .from("dev_snippet_categories")
      .select("id, name, created_at")
      .eq("user_id", uid)
      .order("name");

    if (cErr) throw new Error(userFacingDataError(cErr));

    const { data: rows, error: rErr } = await client
      .from("dev_snippets")
      .select(
        "id, title, kind, language, content, tags, category_id, reference_url, image_url, is_pinned, created_at, updated_at",
      )
      .eq("user_id", uid)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (rErr) throw new Error(userFacingDataError(rErr));

    const names = new Map((cats ?? []).map((c) => [c.id, c.name as string]));
    const snippets: DevSnippet[] = (rows ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      kind: row.kind as DevSnippet["kind"],
      language: row.language as string | null,
      content: row.content as string,
      tags: (row.tags as string[]) ?? [],
      categoryId: row.category_id as string | null,
      categoryName: row.category_id ? names.get(row.category_id as string) ?? null : null,
      referenceUrl: row.reference_url as string | null,
      imageUrl: row.image_url as string | null,
      isPinned: Boolean(row.is_pinned),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));

    const categories: DevSnippetCategory[] = (cats ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      createdAt: c.created_at as string,
    }));

    return { snippets, categories };
  },
  { watch: [() => user.value?.id], server: false },
);

watch(refreshTick, () => {
  void refresh();
});

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
  () => filtered.value.find((s) => s.id === editId.value) ?? data.value?.snippets.find((s) => s.id === editId.value) ?? null,
);

async function createCategory() {
  const uid = user.value?.id;
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
        <DsButton size="sm" @click="openQuickAdd">Ajouter</DsButton>
      </template>
    </DsPageHeader>

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

    <SnippetList
      v-else-if="!error && data"
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
