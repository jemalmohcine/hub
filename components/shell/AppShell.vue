<script setup lang="ts">
import {
  Briefcase,
  Code2,
  Home,
  LayoutGrid,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Settings,
  Sparkles,
  Wrench,
} from "lucide-vue-next";
import { resolveAppShellPageTitle } from "~/shared/shell/page-title";

const route = useRoute();
const user = useSupabaseUser();
const config = useRuntimeConfig();
const buildSha = computed(() => String(config.public.buildSha || "dev"));
const { open, query, filtered, toggle, close, run } = useCommandPalette();
const { openQuickAdd } = useSnippetQuickAdd();
useCommandPaletteShortcuts(toggle, close);

provideAppShellChrome();

const sheetOpen = ref(false);

const mobileTabs = [
  { id: "home", label: "Accueil", href: "/app/overview", icon: Home, match: (p: string) => p.startsWith("/app/overview") },
  {
    id: "ai",
    label: "Veille",
    href: "/app/ai",
    icon: Sparkles,
    match: (p: string) => p.startsWith("/app/ai") || p.startsWith("/app/veille"),
  },
  { id: "snippets", label: "Snippets", href: "/app/snippets", icon: Code2, match: (p: string) => p.startsWith("/app/snippets") },
  { id: "outils", label: "Outils", href: "/app/outils", icon: Wrench, match: (p: string) => p.startsWith("/app/outils") },
] as const;

const primaryTabs = [...mobileTabs];

const overflowLinks = [
  { label: "Carrière", href: "/app/career", icon: Briefcase },
  { label: "Budget", href: "/app/expenses", icon: PiggyBank },
  { label: "Paramètres", href: "/app/settings", icon: Settings },
  { label: "Modules", href: "/app/settings/modules", icon: LayoutGrid },
];

function isActive(match: (p: string) => boolean) {
  return match(route.path);
}

const pageTitle = computed(() => resolveAppShellPageTitle(route.path));

async function signOut() {
  const client = useSupabaseClient();
  await client.auth.signOut();
  navigateTo("/auth/login");
}
</script>

<template>
  <div data-testid="app-shell" class="app-shell flex min-h-dvh flex-col bg-background lg:flex-row">
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

    <div class="app-shell-main-column flex min-h-0 min-w-0 flex-1 flex-col">
      <ShellMobilePageHeader :title="pageTitle" @add="openQuickAdd()" />

      <header
        data-testid="app-top-bar"
        class="app-top-bar hidden shrink-0 border-b border-border pl-[max(var(--dh-space-page),env(safe-area-inset-left))] pr-[max(var(--dh-space-page),env(safe-area-inset-right))] lg:block lg:px-8"
      >
        <div class="app-top-bar__actions flex min-h-16 items-center gap-2">
          <h1
            class="app-top-bar__title min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[length:var(--dh-text-lg)]"
          >
            {{ pageTitle }}
          </h1>
          <button
            type="button"
            class="app-top-bar__cmd inline-flex h-11 min-h-[44px] shrink-0 items-center justify-center rounded-[var(--dh-radius-lg)] px-3"
            aria-label="Palette de commandes"
            @click="toggle"
          >
            ⌘K
          </button>
          <button
            type="button"
            class="app-top-bar__add-btn inline-flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--dh-radius)] px-3 text-[length:var(--dh-text-sm)]"
            data-testid="snippet-add-header-desktop"
            aria-label="Nouveau snippet"
            @click="openQuickAdd()"
          >
            Ajouter
          </button>
        </div>
      </header>

      <main
        data-testid="app-main"
        class="dh-app-main box-border w-full max-w-full flex-1 px-[max(var(--dh-space-page),env(safe-area-inset-left))] py-5 pb-[calc(var(--dh-nav-h)+env(safe-area-inset-bottom)+1.25rem)] max-lg:pr-[max(var(--dh-space-page),env(safe-area-inset-right))] lg:max-w-none lg:px-8 lg:py-8 lg:pb-8"
      >
        <slot />
      </main>
    </div>

    <nav
      data-testid="mobile-bottom-nav"
      class="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navigation mobile"
      style="height: calc(var(--dh-nav-h) + env(safe-area-inset-bottom))"
    >
      <NuxtLink
        v-for="tab in mobileTabs"
        :key="tab.id"
        :to="tab.href"
        class="flex flex-col items-center justify-center gap-0.5 px-1 text-[0.625rem] font-medium leading-tight"
        :class="isActive(tab.match) ? 'text-primary' : 'text-muted-foreground'"
      >
        <component :is="tab.icon" class="h-5 w-5 shrink-0" />
        {{ tab.label }}
      </NuxtLink>
      <button
        type="button"
        class="flex flex-col items-center justify-center gap-0.5 px-1 text-[0.625rem] font-medium leading-tight text-muted-foreground"
        aria-label="Plus de modules"
        @click="sheetOpen = true"
      >
        <MoreHorizontal class="h-5 w-5 shrink-0" />
        Plus
      </button>
    </nav>

    <Teleport to="body">
      <div
        v-if="sheetOpen"
        class="app-shell-scrim fixed inset-0 z-[60] bg-black/40 lg:hidden"
        @click="sheetOpen = false"
      >
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
        class="app-shell-scrim fixed inset-0 z-[60] flex items-start justify-center bg-black/45 p-4 pt-[10vh]"
        @click.self="close"
      >
        <div class="dh-surface w-full max-w-md p-2">
          <DsInput v-model="query" placeholder="Page, outil ou snippet…" aria-label="Palette" class="border-0" />
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

      <button
        v-if="route.path.startsWith('/app')"
        type="button"
        data-testid="snippet-fab"
        class="dh-focus-ring fixed z-[45] hidden h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:bottom-8 lg:right-8 lg:flex"
        aria-label="Nouveau snippet"
        @click="openQuickAdd()"
      >
        <Plus class="h-6 w-6" />
      </button>
    </Teleport>
    <span data-testid="build-sha" class="sr-only" aria-hidden="true">{{ buildSha }}</span>
    <ClientOnly>
      <SnippetsSnippetQuickAddSheet />
    </ClientOnly>
  </div>
</template>
