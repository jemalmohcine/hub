import { detectSnippetLanguage } from "~/shared/snippets/detect-language";

const open = useState("dh-snippet-quick-add-open", () => false);

/** Bump to tell snippet lists to refresh after a quick save. */
const refreshTick = useState("dh-snippet-quick-add-tick", () => 0);

export function useSnippetQuickAdd() {
  function openQuickAdd() {
    open.value = true;
  }

  function closeQuickAdd() {
    open.value = false;
  }

  function notifySnippetSaved() {
    refreshTick.value += 1;
  }

  return {
    quickAddOpen: open,
    refreshTick,
    openQuickAdd,
    closeQuickAdd,
    notifySnippetSaved,
  };
}

export async function pasteClipboardIntoSnippet(content: Ref<string>, language: Ref<string>) {
  if (!import.meta.client || !navigator.clipboard?.readText) return;
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) return;
    if (!content.value.trim()) {
      content.value = text;
      language.value = detectSnippetLanguage(text);
    }
  } catch {
    /* permission denied */
  }
}
