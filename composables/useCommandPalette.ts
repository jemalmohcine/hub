export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  action?: "snippet-quick-add";
};

const open = ref(false);
const query = ref("");

const SNIPPET_TOOL_LINKS: CommandItem[] = [
  { id: "tool-json", label: "JSON formater", hint: "Outils", href: "/app/outils/json" },
  { id: "tool-b64", label: "Base64 / URL", hint: "Outils", href: "/app/outils/encode" },
  { id: "tool-jwt", label: "JWT decoder", hint: "Outils", href: "/app/outils/jwt" },
  { id: "tool-regex", label: "Regex tester", hint: "Outils", href: "/app/outils/regex" },
  { id: "tool-uuid", label: "UUID / hash", hint: "Outils", href: "/app/outils/uuid" },
  { id: "tool-time", label: "Timestamp", hint: "Outils", href: "/app/outils/timestamp" },
  { id: "tool-color", label: "Couleurs", hint: "Outils", href: "/app/outils/color" },
  { id: "tool-hub", label: "Tous les outils", hint: "Outils", href: "/app/outils" },
];

export function useCommandPalette() {
  const { modules } = useHubModules();
  const router = useRouter();
  const client = useSupabaseClient();
  const authUserId = useAuthUserId();
  const { openQuickAdd } = useSnippetQuickAdd();

  const snippetHits = ref<CommandItem[]>([]);

  watch([open, query, authUserId], async () => {
    if (!open.value) return;
    const q = query.value.trim();
    const uid = authUserId.value;
    if (!uid || q.length < 2) {
      snippetHits.value = [];
      return;
    }
    const { data } = await client
      .from("dev_snippets")
      .select("id, title, language")
      .eq("user_id", uid)
      .ilike("title", `%${q}%`)
      .limit(8);
    snippetHits.value = (data ?? []).map((row) => ({
      id: `snip-${row.id}`,
      label: row.title as string,
      hint: (row.language as string) || "snippet",
      href: `/app/snippets?q=${encodeURIComponent(row.title as string)}`,
    }));
  });

  const navItems = computed<CommandItem[]>(() => [
    ...modules.map((m) => ({
      id: m.id,
      label: m.label,
      hint: m.description,
      href: m.href,
    })),
    ...SNIPPET_TOOL_LINKS,
    { id: "new-snippet", label: "Nouveau snippet", hint: "Raccourci N", action: "snippet-quick-add" as const },
  ]);

  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    const base = q
      ? navItems.value.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            (i.hint?.toLowerCase().includes(q) ?? false),
        )
      : navItems.value;
    const merged = [...snippetHits.value, ...base];
    const seen = new Set<string>();
    return merged.filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });
  });

  function toggle() {
    open.value = !open.value;
    if (open.value) query.value = "";
  }

  function close() {
    open.value = false;
    query.value = "";
  }

  function run(item: CommandItem) {
    close();
    if (item.action === "snippet-quick-add") {
      openQuickAdd();
      return;
    }
    if (item.href) router.push(item.href);
  }

  return { open, query, filtered, toggle, close, run };
}

export function useCommandPaletteShortcuts(onToggle: () => void, onClose: () => void) {
  const { openQuickAdd } = useSnippetQuickAdd();

  onMounted(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onToggle();
        return;
      }
      if (!typing && e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const path = window.location.pathname;
        if (path.startsWith("/app")) {
          e.preventDefault();
          openQuickAdd();
        }
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    onUnmounted(() => window.removeEventListener("keydown", onKey));
  });
}
