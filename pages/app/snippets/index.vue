<script setup lang="ts">
import type { DevSnippet, DevSnippetCategory } from "~/shared/snippets/types";
import { rankSnippets } from "~/shared/snippets/match";
import { userFacingDataError } from "~/shared/lib/user-error";

const client = useSupabaseClient();
const authUserId = useAuthUserId();

const q = ref("");
const categoryId = ref<string | null>(null);
const selectedId = ref<string | null>(null);

const { data, pending, error, refresh } = await useAsyncData(
  () => `snippets-${authUserId.value ?? "anon"}`,
  async () => {
    await waitForAuthUserId();
    const uid = authUserId.value;
    if (!uid) {
      throw new Error("Session introuvable. Reconnectez-vous.");
    }

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
  { watch: [authUserId], server: false },
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

const selected = computed(
  () => filtered.value.find((s) => s.id === selectedId.value) ?? null,
);

const ready = computed(() => Boolean(authUserId.value) && Boolean(data.value));
const showWorkspace = computed(() => ready.value && !error.value);

async function createCategory() {
  const uid = authUserId.value;
  if (!uid) return;
  const name = window.prompt("Nom du dossier");
  if (!name?.trim()) return;
  await client.from("dev_snippet_categories").insert({ user_id: uid, name: name.trim() });
  await refresh();
}

function newSnippet() {
  selectedId.value = "__new__";
}

const editorSnippet = computed(() =>
  selectedId.value === "__new__" ? null : selected.value,
);
</script>

<template>
  <div>
    <DsPageHeader
      title="Snippets"
      description="Retrouvez, étiquetez et copiez vos extraits de code."
      :pending="pending && !data"
      :error="error?.message ?? null"
    />
    <p v-if="!error && pending && !data" class="mb-4 text-sm text-muted-foreground">
      Chargement de votre bibliothèque…
    </p>
    <p v-else-if="!error && !pending && !authUserId" class="mb-4 text-sm text-destructive" role="alert">
      Session expirée. Reconnectez-vous pour voir vos snippets.
    </p>
    <template v-if="showWorkspace || authUserId">
      <DsInput v-if="showWorkspace" v-model="q" placeholder="Rechercher…" class="mb-4 max-w-md" aria-label="Rechercher snippets" />
      <div v-if="showWorkspace" class="grid gap-6 lg:grid-cols-[220px_1fr_1fr]">
        <SnippetSidebar
          :categories="data?.categories ?? []"
          :active-id="categoryId"
          @select="categoryId = $event"
          @create="createCategory"
        />
        <div>
          <DsButton size="sm" class="mb-3" @click="newSnippet">Nouveau snippet</DsButton>
          <SnippetList
            :snippets="filtered"
            :selected-id="selectedId"
            @select="selectedId = $event"
          />
        </div>
        <SnippetEditor
          :snippet="editorSnippet"
          @saved="refresh(); selectedId = null"
          @deleted="refresh(); selectedId = null"
        />
      </div>
      <div v-else-if="authUserId && !pending" class="mt-4">
        <DsButton size="sm" @click="refresh">Réessayer le chargement</DsButton>
        <DsButton size="sm" class="ml-2" variant="secondary" @click="newSnippet">Nouveau snippet</DsButton>
      </div>
    </template>
  </div>
</template>
