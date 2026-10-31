<script setup lang="ts">
const { modules } = useHubModules();
const route = useRoute();
const user = useSupabaseUser();
const colorMode = useColorMode();
const { open, query, filtered, toggle, close, run } = useCommandPalette();

useCommandPaletteShortcuts(toggle, close);

function isActive(href: string) {
  return route.path.startsWith(href.split("?")[0]!);
}

async function signOut() {
  const client = useSupabaseClient();
  await client.auth.signOut();
  navigateTo("/auth/login");
}
</script>

<template>
  <div class="app-shell lg:flex">
    <aside
      class="hidden w-[var(--dh-sidebar-w)] shrink-0 flex-col border-r border-border bg-card lg:flex"
    >
      <div class="flex h-14 items-center gap-2 border-b border-border px-4">
        <span class="text-[length:var(--dh-text-base)] font-semibold tracking-tight">DevHub</span>
      </div>
      <nav class="flex-1 space-y-0.5 p-3" aria-label="Modules">
        <NuxtLink
          v-for="mod in modules"
          :key="mod.id"
          :to="mod.href"
          class="dh-focus-ring flex rounded-[var(--dh-radius)] px-3 py-2 text-[length:var(--dh-text-sm)] transition-colors"
          :class="
            isActive(mod.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          "
        >
          {{ mod.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-border p-3 text-[length:var(--dh-text-xs)] text-muted-foreground">
        <p class="truncate" :title="user?.email ?? undefined">{{ user?.email }}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <DsButton
            variant="ghost"
            size="sm"
            @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
          >
            {{ colorMode.value === 'dark' ? 'Clair' : 'Sombre' }}
          </DsButton>
          <DsButton variant="ghost" size="sm" @click="signOut">Sortir</DsButton>
        </div>
      </div>
    </aside>

    <div class="flex min-h-dvh min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-md lg:px-6"
      >
        <nav class="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:hidden" aria-label="Navigation mobile">
          <NuxtLink
            v-for="mod in modules"
            :key="mod.id"
            :to="mod.href"
            class="dh-focus-ring shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[length:var(--dh-text-xs)]"
            :class="isActive(mod.href) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
          >
            {{ mod.label }}
          </NuxtLink>
        </nav>
        <DsButton class="ml-auto shrink-0" variant="secondary" size="sm" aria-label="Palette de commandes" @click="toggle">
          <span class="hidden sm:inline">Recherche</span>
          <kbd class="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </DsButton>
      </header>
      <main class="flex-1 p-4 lg:max-w-6xl lg:p-6">
        <slot />
      </main>
    </div>

    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 pt-[12vh]"
        @click.self="close"
      >
        <div class="dh-surface w-full max-w-md overflow-hidden p-2">
          <DsInput
            v-model="query"
            placeholder="Aller à un module…"
            aria-label="Recherche palette"
            class="border-0 shadow-none"
          />
          <ul class="max-h-64 overflow-y-auto py-1" role="listbox">
            <li v-for="item in filtered" :key="item.id">
              <button
                type="button"
                class="dh-focus-ring flex w-full flex-col rounded-[var(--dh-radius)] px-3 py-2 text-left hover:bg-muted"
                @click="run(item)"
              >
                <span class="text-[length:var(--dh-text-sm)] font-medium">{{ item.label }}</span>
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
