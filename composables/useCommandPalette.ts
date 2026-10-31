export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
};

const open = ref(false);

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

  function toggle() {
    open.value = !open.value;
  }

  function close() {
    open.value = false;
  }

  function run(item: CommandItem) {
    close();
    if (item.href) router.push(item.href);
  }

  return { open, items, toggle, close, run };
}
