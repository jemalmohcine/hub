<script setup lang="ts">
import { detectSnippetLanguage } from "~/shared/snippets/detect-language";

const client = useSupabaseClient();
const user = useSupabaseUser();
const { quickAddOpen, closeQuickAdd, notifySnippetSaved } = useSnippetQuickAdd();
const { showToast } = useToast();

const title = ref("");
const language = ref("typescript");
const content = ref("");
const tagsInput = ref("");
const saving = ref(false);
const titleRef = ref<{ focus: () => void } | null>(null);

watch(quickAddOpen, async (isOpen) => {
  if (!isOpen) return;
  title.value = "";
  language.value = "typescript";
  content.value = "";
  tagsInput.value = "";
  await nextTick();
  titleRef.value?.focus();
  await pasteClipboardIntoSnippet(content, language);
});

watch(content, (value) => {
  if (value.trim().length > 8) {
    language.value = detectSnippetLanguage(value);
  }
});

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function save() {
  const uid = user.value?.id;
  if (!uid || !title.value.trim() || !content.value.trim()) return;
  saving.value = true;
  const { error } = await client.from("dev_snippets").insert({
    user_id: uid,
    title: title.value.trim(),
    kind: "snippet",
    language: language.value,
    content: content.value,
    tags: parseTags(tagsInput.value),
    is_pinned: false,
  });
  saving.value = false;
  if (error) {
    showToast("Enregistrement impossible");
    return;
  }
  closeQuickAdd();
  notifySnippetSaved();
  showToast("Snippet enregistré");
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    void save();
  }
}
</script>

<template>
  <DsSheet :open="quickAddOpen" title="Nouveau snippet" @close="closeQuickAdd">
    <form class="flex flex-col gap-3" @submit.prevent="save" @keydown="onKeydown">
      <DsInput ref="titleRef" v-model="title" placeholder="Titre" autocomplete="off" />
      <div class="flex gap-2">
        <DsInput v-model="language" class="w-36 shrink-0 font-mono text-xs" placeholder="Langage" />
        <p class="flex items-center text-[length:var(--dh-text-xs)] text-muted-foreground">
          Détection auto · ⌘↵ pour enregistrer
        </p>
      </div>
      <DsTextarea v-model="content" :rows="8" placeholder="Colle ton code ici…" class="font-mono text-xs" />
      <DsInput v-model="tagsInput" placeholder="Tags optionnels (virgules)" />
      <DsButton type="submit" class="w-full" :disabled="saving || !title.trim() || !content.trim()">
        Enregistrer
      </DsButton>
    </form>
  </DsSheet>
</template>
