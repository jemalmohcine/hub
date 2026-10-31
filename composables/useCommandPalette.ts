export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
};

const open = ref(false);
const query = ref("");

export function useCommandPalette() {
  const { modules } = useHubModules();
  const router = useRouter();

  const items = computed<CommandItem[]>(() =>
    modules.map((m) => ({
      id: m.id,
      label: m.label,
      hint: m.description,
      href: m.href,
    })),
  );

  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return items.value;
    return items.value.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.hint?.toLowerCase().includes(q) ?? false),
    );
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
    if (item.href) router.push(item.href);
  }

  return { open, query, filtered, toggle, close, run };
}

export function useCommandPaletteShortcuts(onToggle: () => void, onClose: () => void) {
  onMounted(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onToggle();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    onUnmounted(() => window.removeEventListener("keydown", onKey));
  });
}
