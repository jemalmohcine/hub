<script setup lang="ts">
const { modules } = useHubModules();
const route = useRoute();
const user = useSupabaseUser();
const colorMode = useColorMode();
const { open, items, toggle, close, run } = useCommandPalette();

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
      class="hidden w-[var(--dh-sidebar-w)] flex-col border-r border-border bg-card lg:flex"
    >
      <div class="flex h-14 items-center border-b border-border px-4 font-semibold">
        DevHub
      </div>
      <nav class="flex-1 space-y-1 p-3">
        <NuxtLink
          v-for="mod in modules"
          :key="mod.id"
          :to="mod.href"
          class="flex rounded-[var(--dh-radius)] px-3 py-2 text-sm transition-colors"
          :class="
            isActive(mod.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          "
        >
          {{ mod.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-border p-3 text-xs text-muted-foreground">
        <p class="truncate">{{ user?.email }}</p>
        <div class="mt-2 flex gap-2">
          <DsButton variant="ghost" size="sm" @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'">
            Thème
          </DsButton>
          <DsButton variant="ghost" size="sm" @click="signOut">Sortir</DsButton>
        </div>
      </div>
    </aside>

    <div class="flex min-h-dvh flex-1 flex-col">
      <header
        class="flex h-14 items-center gap-2 border-b border-border px-4 lg:px-6"
      >
        <nav class="flex gap-1 overflow-x-auto lg:hidden">
          <NuxtLink
            v-for="mod in modules.slice(0, 4)"
            :key="mod.id"
            :to="mod.href"
            class="whitespace-nowrap rounded-full px-3 py-1 text-xs"
            :class="isActive(mod.href) ? 'bg-primary text-primary-foreground' : 'bg-muted'"
          >
            {{ mod.label }}
          </NuxtLink>
        </nav>
        <DsButton class="ml-auto" variant="secondary" size="sm" @click="toggle">
          ⌘K
        </DsButton>
      </header>
      <main class="flex-1 p-4 lg:p-6">
        <slot />
      </main>
    </div>

    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[15vh]"
        @click.self="close"
      >
        <DsCard class="w-full max-w-md p-2">
          <ul>
            <li v-for="item in items" :key="item.id">
              <button
                type="button"
                class="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-muted"
                @click="run(item)"
              >
                <span class="text-sm font-medium">{{ item.label }}</span>
                <span v-if="item.hint" class="text-xs text-muted-foreground">{{ item.hint }}</span>
              </button>
            </li>
          </ul>
        </DsCard>
      </div>
    </Teleport>
  </div>
</template>
