<script setup lang="ts">
import { Briefcase, Code2, Home, LayoutGrid, MoreHorizontal, PiggyBank, Settings, Sparkles } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const user = useSupabaseUser();
const { open, query, filtered, toggle, close, run } = useCommandPalette();
useCommandPaletteShortcuts(toggle, close);

const sheetOpen = ref(false);

const primaryTabs = [
  { id: "home", label: "Accueil", href: "/app/overview", icon: Home, match: (p: string) => p.startsWith("/app/overview") },
  { id: "ai", label: "Veille", href: "/app/ai", icon: Sparkles, match: (p: string) => p.startsWith("/app/ai") },
  { id: "snippets", label: "Snippets", href: "/app/snippets", icon: Code2, match: (p: string) => p.startsWith("/app/snippets") },
] as const;

const overflowLinks = [
  { label: "Carrière", href: "/app/career", icon: Briefcase },
  { label: "Budget", href: "/app/expenses", icon: PiggyBank },
  { label: "Paramètres", href: "/app/settings", icon: Settings },
  { label: "Modules", href: "/app/settings/modules", icon: LayoutGrid },
];

function isActive(match: (p: string) => boolean) {
  return match(route.path);
}

const pageTitle = computed(() => {
  if (route.path.startsWith("/app/ai")) return "Veille";
  if (route.path.startsWith("/app/snippets")) return "Snippets";
  if (route.path.startsWith("/app/career")) return "Carrière";
  if (route.path.startsWith("/app/expenses")) return "Budget";
  if (route.path.startsWith("/app/settings")) return "Paramètres";
  if (route.path === "/admin") return "Admin";
  if (route.path.startsWith("/app/overview")) return "Accueil";
  return "hub";
});

async function signOut() {
  const client = useSupabaseClient();
  await client.auth.signOut();
  navigateTo("/auth/login");
}
</script>

<template>
  <div class="app-shell flex min-h-dvh flex-col bg-background lg:flex-row">
    <aside
      class="hidden w-[var(--dh-sidebar-w)] shrink-0 flex-col border-r border-border/70 bg-card/40 lg:flex"
    >
      <div class="flex h-16 items-center gap-2 px-5">
        <NuxtLink to="/app/overview" class="dh-focus-ring flex items-center gap-2.5 font-semibold">
          <img src="/icons/icon.svg" alt="" class="h-9 w-9 rounded-[var(--dh-radius)]" width="36" height="36" />
          <span class="text-[length:var(--dh-text-base)]">hub</span>
        </NuxtLink>
      </div>
      <nav class="flex flex-1 flex-col gap-1 px-3 pb-4" aria-label="Navigation">
        <NuxtLink
          v-for="tab in primaryTabs"
          :key="tab.id"
          :to="tab.href"
          class="dh-focus-ring flex items-center gap-3 rounded-[var(--dh-radius-lg)] px-3 py-2.5 font-medium transition-colors"
          :class="isActive(tab.match) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </NuxtLink>
        <p class="mb-1 mt-4 px-3 text-[length:var(--dh-text-xs)] font-semibold uppercase tracking-wide text-muted-foreground">
          Plus
        </p>
        <NuxtLink
          v-for="link in overflowLinks"
          :key="link.href"
          :to="link.href"
          class="dh-focus-ring rounded-[var(--dh-radius-lg)] px-3 py-2 text-[length:var(--dh-text-sm)] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
      <p class="truncate border-t border-border/70 px-5 py-3 text-[length:var(--dh-text-xs)] text-muted-foreground">
        {{ user?.email }}
      </p>
    </aside>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/90 px-[var(--dh-space-page)] pt-[env(safe-area-inset-top)] backdrop-blur-md lg:h-16 lg:px-8"
      >
        <NuxtLink
          to="/app/overview"
          class="dh-focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[var(--dh-radius-lg)] border border-border bg-card lg:hidden"
          aria-label="Accueil"
        >
          <Home class="h-5 w-5 text-primary" />
        </NuxtLink>
        <h1 class="min-w-0 flex-1 truncate text-[length:var(--dh-text-base)] font-semibold lg:text-[length:var(--dh-text-lg)]">
          {{ pageTitle }}
        </h1>
        <DsButton variant="ghost" size="sm" aria-label="Rechercher" @click="toggle">
          ⌘K
        </DsButton>
      </header>

      <main
        class="dh-app-main flex-1 px-[var(--dh-space-page)] py-5 pb-[calc(var(--dh-nav-h)+env(safe-area-inset-bottom)+1rem)] lg:max-w-none lg:px-8 lg:py-8 lg:pb-8"
      >
        <slot />
      </main>
    </div>

    <nav
      class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Navigation mobile"
      style="height: calc(var(--dh-nav-h) + env(safe-area-inset-bottom))"
    >
      <NuxtLink
        v-for="tab in primaryTabs"
        :key="tab.id"
        :to="tab.href"
        class="flex flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium"
        :class="isActive(tab.match) ? 'text-primary' : 'text-muted-foreground'"
      >
        <component :is="tab.icon" class="h-5 w-5" />
        {{ tab.label }}
      </NuxtLink>
      <button
        type="button"
        class="flex flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium text-muted-foreground"
        aria-label="Plus de modules"
        @click="sheetOpen = true"
      >
        <MoreHorizontal class="h-5 w-5" />
        Plus
      </button>
    </nav>

    <Teleport to="body">
      <div v-if="sheetOpen" class="fixed inset-0 z-50 bg-black/40 lg:hidden" @click="sheetOpen = false">
        <div
          class="absolute inset-x-0 bottom-0 rounded-t-[var(--dh-radius-xl)] border border-border bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
          @click.stop
        >
          <p class="mb-3 text-[length:var(--dh-text-sm)] font-semibold">Aller à</p>
          <div class="grid gap-2">
            <NuxtLink
              v-for="link in overflowLinks"
              :key="link.href"
              :to="link.href"
              class="dh-focus-ring flex items-center gap-3 rounded-[var(--dh-radius-lg)] px-3 py-3 hover:bg-muted"
              @click="sheetOpen = false"
            >
              <component :is="link.icon" class="h-5 w-5 text-primary" />
              {{ link.label }}
            </NuxtLink>
            <button
              type="button"
              class="mt-2 text-left text-[length:var(--dh-text-sm)] text-destructive"
              @click="signOut(); sheetOpen = false"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 pt-[10vh]"
        @click.self="close"
      >
        <div class="dh-surface w-full max-w-md p-2">
          <DsInput v-model="query" placeholder="Module ou page…" aria-label="Palette" class="border-0" />
          <ul class="max-h-64 overflow-y-auto py-1">
            <li v-for="item in filtered" :key="item.id">
              <button
                type="button"
                class="dh-focus-ring w-full rounded-[var(--dh-radius)] px-3 py-2 text-left hover:bg-muted"
                @click="run(item)"
              >
                <span class="font-medium">{{ item.label }}</span>
                <span v-if="item.hint" class="block text-xs text-muted-foreground">{{ item.hint }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Teleport>
  </div>
</template>
