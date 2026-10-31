<script setup lang="ts">
const client = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();

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
    if (p && p.role !== "admin") router.replace("/app/overview");
  },
  { immediate: true },
);

const { data: stats } = await useAsyncData(
  "admin-stats",
  async () => {
    const [{ count: users }, { data: flags }] = await Promise.all([
      client.from("profiles").select("*", { count: "exact", head: true }),
      client.from("module_flags").select("module_id, enabled"),
    ]);
    return { users: users ?? 0, flags: flags ?? [] };
  },
  { server: false },
);
</script>

<template>
  <div>
    <DsPageHeader title="Admin" description="Flags modules et vue plateforme." />
    <div v-if="stats" class="grid gap-3 sm:grid-cols-2">
      <DsCard class="p-4">
        <p class="text-xs font-medium uppercase text-muted-foreground">Utilisateurs</p>
        <p class="mt-1 text-2xl font-semibold">{{ stats.users }}</p>
      </DsCard>
      <DsCard class="p-4">
        <p class="text-xs font-medium uppercase text-muted-foreground">Flags modules</p>
        <p class="mt-1 text-2xl font-semibold">{{ stats.flags.length }}</p>
      </DsCard>
    </div>
    <DsCard v-if="stats?.flags.length" class="mt-6 divide-y divide-border">
      <div v-for="flag in stats.flags" :key="flag.module_id as string" class="flex justify-between px-4 py-3 text-sm">
        <span>{{ flag.module_id }}</span>
        <span :class="flag.enabled ? 'text-success' : 'text-muted-foreground'">
          {{ flag.enabled ? "Actif" : "Désactivé" }}
        </span>
      </div>
    </DsCard>
  </div>
</template>
