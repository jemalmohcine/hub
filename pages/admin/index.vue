<script setup lang="ts">
import { getSortedModules } from "~/shared/core/module-registry";

const client = useSupabaseClient();
const user = useSupabaseUser();
const toggling = ref<string | null>(null);

const { data: profile } = await useAsyncData(
  () => `admin-gate-${user.value?.id ?? "anon"}`,
  async () => {
    const uid = user.value?.id;
    if (!uid) return null;
    const { data } = await client.from("profiles").select("role").eq("id", uid).maybeSingle();
    return data;
  },
  { watch: [() => user.value?.id], server: false },
);

watch(
  profile,
  (p) => {
    if (p && p.role !== "admin") navigateTo("/app/overview");
  },
  { immediate: true },
);

const { data: stats, refresh } = await useAsyncData(
  "admin-stats",
  async () => {
    const [{ count: users }, { data: flags }] = await Promise.all([
      client.from("profiles").select("*", { count: "exact", head: true }),
      client.from("module_flags").select("module_id, enabled"),
    ]);
    return { users: users ?? 0, flags: flags ?? [], modules: getSortedModules() };
  },
  { server: false },
);

const flagMap = computed(() => {
  const map = new Map<string, boolean>();
  for (const f of stats.value?.flags ?? []) {
    map.set(f.module_id as string, Boolean(f.enabled));
  }
  return map;
});

async function toggle(modId: string, enabled: boolean) {
  toggling.value = modId;
  try {
    await $fetch("/api/admin/module-flag", {
      method: "POST",
      body: { moduleId: modId, enabled },
    });
    await refresh();
  } finally {
    toggling.value = null;
  }
}
</script>

<template>
  <div>
    <DsPageHeader title="Admin" description="Flags modules et vue plateforme.">
      <template #actions>
        <DsBadge tone="success">admin</DsBadge>
      </template>
    </DsPageHeader>
    <div v-if="stats" class="mb-6 grid grid-cols-2 gap-3">
      <DsCard class="p-4">
        <p class="text-xs font-medium uppercase text-muted-foreground">Utilisateurs</p>
        <p class="mt-1 text-2xl font-semibold">{{ stats.users }}</p>
      </DsCard>
      <DsCard class="p-4">
        <p class="text-xs font-medium uppercase text-muted-foreground">Modules</p>
        <p class="mt-1 text-2xl font-semibold">{{ stats.modules.length }}</p>
      </DsCard>
    </div>
    <h2 class="mb-3 text-sm font-semibold">Module flags</h2>
    <div class="flex flex-col gap-2">
      <DsCard v-for="mod in stats?.modules ?? []" :key="mod.id" class="flex items-center justify-between gap-3 p-4">
        <div>
          <p class="font-medium">{{ mod.label }}</p>
          <p class="text-xs text-muted-foreground">
            {{ flagMap.get(mod.id) ?? true ? "Actif globalement" : "Désactivé globalement" }}
          </p>
        </div>
        <DsButton
          variant="secondary"
          size="sm"
          :disabled="toggling === mod.id"
          @click="toggle(mod.id, !(flagMap.get(mod.id) ?? true))"
        >
          {{ flagMap.get(mod.id) ?? true ? "Désactiver" : "Activer" }}
        </DsButton>
      </DsCard>
    </div>
  </div>
</template>
