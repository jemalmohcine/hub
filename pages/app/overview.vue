<script setup lang="ts">
const { modules } = useHubModules();
const tiles = computed(() => modules.filter((m) => m.id !== "overview"));

const client = useSupabaseClient();
const user = useSupabaseUser();

const { data: stats } = await useAsyncData(
  () => `overview-${user.value?.id ?? "anon"}`,
  async () => {
    const uid = user.value?.id;
    if (!uid) return null;

    const [snippets, veille, saves, tools] = await Promise.all([
      client.from("dev_snippets").select("id", { count: "exact", head: true }).eq("user_id", uid),
      client.from("veille_ia_items").select("id", { count: "exact", head: true }),
      client.from("dev_tool_saves").select("id", { count: "exact", head: true }).eq("user_id", uid),
      client.from("job_applications").select("id", { count: "exact", head: true }).eq("user_id", uid),
    ]);

    return {
      snippets: snippets.count ?? 0,
      veille: veille.count ?? 0,
      toolSaves: saves.count ?? 0,
      applications: tools.count ?? 0,
    };
  },
  { watch: [() => user.value?.id], server: false },
);
</script>

<template>
  <div>
    <DsPageHeader title="Tableau de bord" description="Accédez rapidement à chaque module." />

    <div v-if="stats" class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <DsCard class="p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Snippets</p>
        <p class="mt-1 text-2xl font-semibold text-foreground">{{ stats.snippets }}</p>
      </DsCard>
      <DsCard class="p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Veille</p>
        <p class="mt-1 text-2xl font-semibold text-foreground">{{ stats.veille }}</p>
      </DsCard>
      <DsCard class="p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Suivis</p>
        <p class="mt-1 text-2xl font-semibold text-foreground">{{ stats.toolSaves }}</p>
      </DsCard>
      <DsCard class="p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Candidatures</p>
        <p class="mt-1 text-2xl font-semibold text-foreground">{{ stats.applications }}</p>
      </DsCard>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <NuxtLink v-for="mod in tiles" :key="mod.id" :to="mod.href">
        <DsCard class="group p-5 transition-all hover:border-primary/40 hover:shadow-md">
          <h2 class="font-semibold text-foreground group-hover:text-primary">{{ mod.label }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">{{ mod.description }}</p>
        </DsCard>
      </NuxtLink>
    </div>
  </div>
</template>
