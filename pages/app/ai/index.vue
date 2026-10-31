<script setup lang="ts">
import type { VeilleItem } from "~/shared/veille/types";
import { toDayKey } from "~/shared/lib/dates";
import { userFacingDataError } from "~/shared/lib/user-error";
import { filterClientVeilleItems } from "~/shared/veille/client-filter";
import { collectVeilleDays, latestVeilleFeedDay } from "~/shared/veille/days";

const client = useSupabaseClient();
const authUserId = useAuthUserId();

const loadError = ref<string | null>(null);

const { data, pending, error, refresh } = await useAsyncData(
  () => `veille-${authUserId.value ?? "anon"}`,
  async () => {
    loadError.value = null;
    await waitForAuthUserId();

    const uid = authUserId.value;

    const { data: rows, error: qErr } = await client
      .from("veille_ia_items")
      .select("*")
      .order("feed_date", { ascending: false })
      .limit(800);

    if (qErr) {
      loadError.value = userFacingDataError(qErr);
      throw new Error(loadError.value);
    }

    let saved = new Set<string>();
    if (uid) {
      const { data: saves, error: sErr } = await client
        .from("veille_ia_saves")
        .select("item_id")
        .eq("user_id", uid);
      if (sErr) {
        loadError.value = userFacingDataError(sErr);
        throw new Error(loadError.value);
      }
      saved = new Set((saves ?? []).map((s) => s.item_id as string));
    }

    const rowsClient = filterClientVeilleItems(rows ?? []);
    const items = rowsClient.map((row) => ({
      ...(row as VeilleItem),
      saved: saved.has(row.id as string),
    }));

    const days = collectVeilleDays(items);
    const day = latestVeilleFeedDay(items) ?? days[0] ?? toDayKey(new Date());
    return { items, days, day };
  },
  { watch: [authUserId], server: false },
);

const feed = computed(
  () => data.value ?? { items: [] as VeilleItem[], days: [] as string[], day: toDayKey(new Date()) },
);

const displayError = computed(() => error.value?.message ?? loadError.value);
</script>

<template>
  <div>
    <DsPageHeader
      title="Veille IA"
      description="Actualités sélectionnées. Filtrez par date, catégorie ou éditeur."
      :pending="pending && !data"
      :error="displayError"
    />
    <VeilleWorkspace
      v-if="!displayError && data && feed.items.length > 0"
      :initial-items="feed.items"
      :initial-day="feed.day"
      :days="feed.days"
    />
    <DsEmptyState
      v-else-if="!displayError && !pending && data && feed.items.length === 0"
      class="mt-8"
      title="Aucune actualité"
      description="Le fil sera alimenté prochainement."
    />
  </div>
</template>
