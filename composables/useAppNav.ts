const PRIMARY_TAB_PATHS = [
  "/app/overview",
  "/app/ai",
  "/app/snippets",
  "/app/outils",
  "/app/career",
  "/app/expenses",
  "/app/settings",
] as const;

export function useAppNav() {
  const route = useRoute();

  const backTarget = computed((): string | null => {
    const path = route.path;
    if (PRIMARY_TAB_PATHS.includes(path as (typeof PRIMARY_TAB_PATHS)[number])) return null;
    if (path.startsWith("/app/outils/")) return "/app/outils";
    if (path.startsWith("/app/settings/")) return "/app/settings";
    if (path.startsWith("/app/")) return "/app/overview";
    return null;
  });

  const showMobileBack = computed(() => Boolean(backTarget.value));

  return { backTarget, showMobileBack };
}
