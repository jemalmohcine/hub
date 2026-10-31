<script setup lang="ts">
import type { DevTool } from "~/shared/dev-tools/types";
import { PRICING_LABELS } from "~/shared/dev-tools/types";
import { userFacingDataError } from "~/shared/lib/user-error";

const client = useSupabaseClient();
const authUserId = useAuthUserId();

const q = ref("");
const freeOnly = ref(true);
const savedOnly = ref(false);

const { data, pending, error, refresh } = await useAsyncData(
  () => `offres-${authUserId.value ?? "anon"}`,
  async () => {
    await waitForAuthUserId();
  const uid = authUserId.value;
  const { data: tools, error: toolsErr } = await client
    .from("dev_tools")
    .select("*")
    .order("overall_score", { ascending: false })
    .limit(400);

  if (toolsErr) throw new Error(userFacingDataError(toolsErr));

  const mapped: DevTool[] = (tools ?? []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    category: row.category as DevTool["category"],
    tagline: row.tagline as string | null,
    summary: row.summary as string | null,
    websiteUrl: row.website_url as string | null,
    pricingUrl: row.pricing_url as string | null,
    docsUrl: row.docs_url as string | null,
    repoFullName: row.repo_full_name as string | null,
    pricingModel: row.pricing_model as DevTool["pricingModel"],
    hasFreeTier: Boolean(row.has_free_tier),
    freeTierNote: row.free_tier_note as string | null,
    startingPriceEur: row.starting_price_eur as number | null,
    license: row.license as string | null,
    stars: row.stars as number | null,
    forks: null,
    openIssues: null,
    repoCreatedAt: null,
    lastCommitAt: null,
    lastReleaseAt: null,
    lastReleaseTag: null,
    isArchived: Boolean(row.is_archived),
    popularityScore: Number(row.popularity_score) || 0,
    stabilityScore: Number(row.stability_score) || 0,
    overallScore: Number(row.overall_score) || 0,
    maturity: row.maturity as DevTool["maturity"],
    audience: row.audience as DevTool["audience"],
    bestFor: row.best_for as string | null,
    pros: (row.pros as string[]) ?? [],
    cons: (row.cons as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    alternativeSlugs: [],
    dataSource: row.data_source as DevTool["dataSource"],
    discoveredVia: null,
    scrapedAt: row.scraped_at as string | null,
    updatedAt: row.updated_at as string,
    saved: false,
  }));

  let savedIds = new Set<string>();
  if (uid) {
    const { data: saves, error: savesErr } = await client
      .from("dev_tool_saves")
      .select("tool_id")
      .eq("user_id", uid);
    if (savesErr) throw new Error(userFacingDataError(savesErr));
    savedIds = new Set((saves ?? []).map((s) => s.tool_id as string));
  }

  return mapped.map((t) => ({ ...t, saved: savedIds.has(t.id) }));
  },
  { watch: [authUserId], server: false },
);

const filtered = computed(() => {
  let list = data.value ?? [];
  if (freeOnly.value) list = list.filter((t) => t.hasFreeTier || t.pricingModel === "free" || t.pricingModel === "open_source");
  if (savedOnly.value) list = list.filter((t) => t.saved);
  const query = q.value.trim().toLowerCase();
  if (query) {
    list = list.filter((t) =>
      `${t.name} ${t.tagline ?? ""} ${t.summary ?? ""} ${t.tags.join(" ")}`.toLowerCase().includes(query),
    );
  }
  return list;
});

async function toggleSave(tool: DevTool) {
  const uid = authUserId.value;
  if (!uid) return;
  if (tool.saved) {
    await client.from("dev_tool_saves").delete().eq("user_id", uid).eq("tool_id", tool.id);
    tool.saved = false;
  } else {
    await client.from("dev_tool_saves").insert({ user_id: uid, tool_id: tool.id });
    tool.saved = true;
  }
}
</script>

<template>
  <div>
    <DsPageHeader
      title="Offres gratuites"
      description="Crédits offerts, essais gratuits et programmes étudiants ou open source."
      :pending="pending && !data"
      :error="error?.message ?? null"
    />
    <div v-if="!error" class="flex flex-wrap gap-2">
      <DsInput v-model="q" placeholder="Filtrer…" class="max-w-sm flex-1" />
      <DsButton :variant="freeOnly ? 'primary' : 'secondary'" size="sm" @click="freeOnly = !freeOnly">
        Offre gratuite
      </DsButton>
      <DsButton :variant="savedOnly ? 'primary' : 'secondary'" size="sm" @click="savedOnly = !savedOnly">
        Mes suivis
      </DsButton>
    </div>

    <div v-if="!error" class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <DsCard v-for="tool in filtered" :key="tool.id" class="flex flex-col p-4">
        <div class="flex items-start justify-between gap-2">
          <h2 class="font-semibold">{{ tool.name }}</h2>
          <DsBadge tone="success">{{ PRICING_LABELS[tool.pricingModel] }}</DsBadge>
        </div>
        <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ tool.tagline || tool.summary }}</p>
        <p v-if="tool.freeTierNote" class="mt-2 text-xs text-muted-foreground">{{ tool.freeTierNote }}</p>
        <div class="mt-auto flex flex-wrap gap-2 pt-4">
          <DsButton variant="secondary" size="sm" @click="toggleSave(tool)">
            {{ tool.saved ? "Suivi ✓" : "Suivre" }}
          </DsButton>
          <a
            v-if="tool.websiteUrl"
            :href="tool.websiteUrl"
            target="_blank"
            rel="noopener"
            class="text-sm text-primary underline"
          >
            Site
          </a>
        </div>
      </DsCard>
    </div>
    <DsEmptyState
      v-if="!error && filtered.length === 0"
      class="mt-8"
      title="Aucun outil"
      description="Aucun résultat avec ces filtres. Élargissez la recherche ou revenez plus tard."
    />
  </div>
</template>
