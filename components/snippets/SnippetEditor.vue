<script setup lang="ts">
import type { DevSnippet, DevSnippetInput } from "~/shared/snippets/types";

const props = defineProps<{
  snippet: DevSnippet | null;
}>();

const emit = defineEmits<{ saved: []; deleted: [] }>();

const client = useSupabaseClient();
const user = useSupabaseUser();

const form = reactive<DevSnippetInput>({
  title: "",
  kind: "snippet",
  language: "typescript",
  content: "",
  tags: [],
});

watch(
  () => props.snippet,
  (s) => {
    if (!s) {
      Object.assign(form, {
        title: "",
        kind: "snippet",
        language: "typescript",
        content: "",
        tags: [],
      });
      return;
    }
    Object.assign(form, {
      title: s.title,
      kind: s.kind,
      language: s.language || "typescript",
      content: s.content,
      tags: s.tags,
      categoryId: s.categoryId,
    });
  },
  { immediate: true },
);

async function save() {
  const uid = user.value?.id;
  if (!uid) return;
  const row = {
    user_id: uid,
    title: form.title.trim(),
    kind: form.kind,
    language: form.language,
    content: form.content,
    tags: form.tags,
    category_id: form.categoryId ?? null,
    reference_url: form.referenceUrl ?? null,
    is_pinned: form.isPinned ?? false,
  };
  if (props.snippet?.id) {
    await client.from("dev_snippets").update(row).eq("id", props.snippet.id);
  } else {
    await client.from("dev_snippets").insert(row);
  }
  emit("saved");
}

async function remove() {
  if (!props.snippet?.id) return;
  await client.from("dev_snippets").delete().eq("id", props.snippet.id);
  emit("deleted");
}

async function copyContent() {
  if (!form.content) return;
  await navigator.clipboard.writeText(form.content);
}
</script>

<template>
  <DsCard v-if="snippet || form.title || form.content" class="p-4">
    <div class="flex flex-wrap gap-2">
      <DsInput v-model="form.title" placeholder="Titre" />
      <DsInput v-model="form.language" placeholder="Langage" class="max-w-[140px]" />
    </div>
    <DsTextarea v-model="form.content" class="mt-3" placeholder="Contenu" :rows="12" />
    <div class="mt-3 flex flex-wrap gap-2">
      <DsButton @click="save">Enregistrer</DsButton>
      <DsButton variant="secondary" @click="copyContent">Copier</DsButton>
      <DsButton v-if="snippet" variant="danger" @click="remove">Supprimer</DsButton>
    </div>
  </DsCard>
  <DsEmptyState v-else title="Sélectionne ou crée un snippet" />
</template>
