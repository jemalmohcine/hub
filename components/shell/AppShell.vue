<script setup lang="ts">
import {
  Bot,
  Briefcase,
  ChevronLeft,
  Code2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  PiggyBank,
  Search,
  Settings,
  X,
} from "lucide-vue-next";

const { modules } = useHubModules();
const route = useRoute();
const router = useRouter();
const authUserId = useAuthUserId();
const authEmail = useAuthUserEmail();
const colorMode = useColorMode();
const { open, query, filtered, toggle, close, run } = useCommandPalette();

useCommandPaletteShortcuts(toggle, close);

const menuOpen = ref(false);
const userMenuOpen = ref(false);
const moreOpen = ref(false);

const mobileTabs = computed(() =>
  modules.filter((m) => ["overview", "ai", "career", "snippets"].includes(m.id)),
);

const iconMap: Record<string, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  bot: Bot,
  code: Code2,
  briefcase: Briefcase,
  "piggy-bank": PiggyBank,
};

function isActive(href: string) {
  const path = route.path;
  const base = href.split("?")[0]!;
  if (base === "/app/career") {
    return path.startsWith("/app/career") || path.startsWith("/app/profil") || path.startsWith("/app/cv");
  }
  if (base === "/app/expenses") {
    return path.startsWith("/app/expenses") || path.startsWith("/app/offres");
  }
  return path.startsWith(base);
}

const pageTitle = computed(() => {
  const mod = modules.find((m) => isActive(m.href));
  if (mod) return mod.label;
  if (route.path.startsWith("/app/settings")) return "Paramètres";
  return "DevHub";
});

const showBack = computed(() => route.path !== "/app/overview" && route.path.startsWith("/app"));

function goBack() {
  if (route.path.startsWith("/app/settings")) {
    router.push("/app/overview");
    return;
  }
  router.push("/app/overview");
}

async function signOut() {
  const client = useSupabaseClient();
  await client.auth.signOut();
  navigateTo("/auth/login");
}

function closeMenus() {
  menuOpen.value = false;
  userMenuOpen.value = false;
  moreOpen.value = false;
}
</script>

<template>
  <div class="app-shell flex min-h-dvh bg-background">
    <aside
      class="hidden w-[var(--dh-sidebar-w)] shrink-0 flex-col border-r border-border/80 bg-card/50 backdrop-blur-sm lg:flex"
    >
      <div class="flex h-14 items-center gap-2 border-b border-border/80 px-4">
        <NuxtLink to="/app/overview" class="dh-focus-ring flex items-center gap-2 font-semibold text-foreground">
          <img src="/brand/logo.svg" alt="" class="h-8 w-8 rounded-lg" width="32" height="32" />
          DevHub
        </NuxtLink>
      </div>
      <nav class="flex-1 space-y-1 p-3" aria-label="Navigation principale">
        <NuxtLink
          v-for="mod in modules"
          :key="mod.id"
          :to="mod.href"
          class="dh-focus-ring flex items-center gap-3 rounded-[var(--dh-radius)] px-3 py-2.5 text-[length:var(--dh-text-sm)] font-medium transition-colors"
          :class="
            isActive(mod.href)
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          "
        >
          <component :is="iconMap[mod.icon] ?? LayoutDashboard" class="h-4 w-4 shrink-0" aria-hidden="true" />
          {{ mod.label }}
        </NuxtLink>
        <NuxtLink
          to="/app/settings"
          class="dh-focus-ring mt-2 flex items-center gap-3 rounded-[var(--dh-radius)] px-3 py-2.5 text-[length:var(--dh-text-sm)] font-medium transition-colors"
          :class="
            isActive('/app/settings')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          "
        >
          <Settings class="h-4 w-4" aria-hidden="true" />
          Paramètres
        </NuxtLink>
      </nav>
      <div class="border-t border-border/80 p-3">
        <p class="truncate text-[length:var(--dh-text-xs)] text-muted-foreground" :title="authEmail ?? undefined">
          {{ authEmail }}
        </p>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
      <header
        class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/80 bg-background/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:px-6"
      >
        <DsButton
          v-if="showBack"
          variant="ghost"
          size="sm"
          class="lg:hidden"
          aria-label="Retour à l’accueil"
          @click="goBack"
        >
          <ChevronLeft class="h-5 w-5" />
        </DsButton>
        <NuxtLink to="/app/overview" class="dh-focus-ring truncate text-[length:var(--dh-text-sm)] font-semibold text-foreground lg:hidden">
          {{ pageTitle }}
        </NuxtLink>
        <span class="hidden text-[length:var(--dh-text-sm)] font-semibold text-foreground lg:inline">
          {{ pageTitle }}
        </span>
        <div class="ml-auto flex items-center gap-1">
          <DsButton variant="secondary" size="sm" aria-label="Recherche" @click="toggle">
            <Search class="h-4 w-4" />
            <kbd class="ml-1 hidden rounded border border-border bg-muted px-1 font-mono text-[10px] sm:inline">⌘K</kbd>
          </DsButton>
          <div class="relative">
            <DsButton
              variant="ghost"
              size="sm"
              aria-label="Menu compte"
              @click="userMenuOpen = !userMenuOpen"
            >
              <Menu class="h-5 w-5" />
            </DsButton>
            <div
              v-if="userMenuOpen"
              class="absolute right-0 top-full z-50 mt-1 w-52 rounded-[var(--dh-radius-lg)] border border-border bg-card py-1 shadow-lg"
            >
              <NuxtLink
                to="/app/settings"
                class="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                @click="closeMenus"
              >
                <Settings class="h-4 w-4" />
                Paramètres
              </NuxtLink>
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                @click="signOut"
              >
                <LogOut class="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 px-4 py-5 lg:max-w-6xl lg:px-8 lg:py-8">
        <slot />
      </main>
    </div>

    <nav
      class="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Navigation mobile"
    >
      <NuxtLink
        v-for="tab in mobileTabs"
        :key="tab.id"
        :to="tab.href"
        class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
        :class="isActive(tab.href) ? 'text-primary' : 'text-muted-foreground'"
      >
        <component :is="iconMap[tab.icon] ?? LayoutDashboard" class="h-5 w-5" aria-hidden="true" />
        <span>{{ tab.id === "overview" ? "Accueil" : tab.id === "career" ? "Carrière" : tab.label.replace("Veille IA", "Veille") }}</span>
      </NuxtLink>
      <button
        type="button"
        class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
        :class="moreOpen || isActive('/app/expenses') || isActive('/app/settings') ? 'text-primary' : 'text-muted-foreground'"
        aria-label="Plus de modules"
        @click="moreOpen = !moreOpen"
      >
        <MoreHorizontal class="h-5 w-5" aria-hidden="true" />
        <span>Plus</span>
      </button>
    </nav>

    <div
      v-if="moreOpen"
      class="fixed inset-0 z-50 bg-black/40 lg:hidden"
      @click="moreOpen = false"
    >
      <div
        class="absolute inset-x-0 bottom-0 rounded-t-[var(--dh-radius-lg)] border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        @click.stop
      >
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Autres modules</p>
        <NuxtLink
          v-for="mod in modules.filter((m) => m.id === 'expenses')"
          :key="mod.id"
          :to="mod.href"
          class="flex items-center gap-3 rounded-[var(--dh-radius)] px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
          @click="closeMenus"
        >
          <PiggyBank class="h-5 w-5 text-primary" aria-hidden="true" />
          {{ mod.label }}
        </NuxtLink>
        <NuxtLink
          to="/app/settings"
          class="flex items-center gap-3 rounded-[var(--dh-radius)] px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
          @click="closeMenus"
        >
          <Settings class="h-5 w-5 text-primary" aria-hidden="true" />
          Paramètres
        </NuxtLink>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]"
        @click.self="close"
      >
        <div class="dh-surface w-full max-w-md overflow-hidden p-2">
          <div class="flex items-center gap-2 px-1 pb-2">
            <Search class="h-4 w-4 text-muted-foreground" />
            <DsInput
              v-model="query"
              placeholder="Aller à un module…"
              aria-label="Recherche palette"
              class="border-0 shadow-none"
            />
            <button type="button" class="dh-focus-ring rounded p-1" @click="close">
              <X class="h-4 w-4" />
            </button>
          </div>
          <ul class="max-h-64 overflow-y-auto py-1" role="listbox">
            <li v-for="item in filtered" :key="item.id">
              <button
                type="button"
                class="dh-focus-ring flex w-full flex-col rounded-[var(--dh-radius)] px-3 py-2 text-left hover:bg-muted"
                @click="run(item)"
              >
                <span class="text-[length:var(--dh-text-sm)] font-medium text-foreground">{{ item.label }}</span>
                <span v-if="item.hint" class="text-[length:var(--dh-text-xs)] text-muted-foreground">{{ item.hint }}</span>
              </button>
            </li>
            <li v-if="filtered.length === 0" class="px-3 py-4 text-center text-sm text-muted-foreground">
              Aucun résultat
            </li>
          </ul>
        </div>
      </div>
    </Teleport>
  </div>
</template>
