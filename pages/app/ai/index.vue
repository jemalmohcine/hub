<script setup lang="ts">
import type { VeilleItem } from "~/shared/veille/types";
import { sortVeilleItems } from "~/shared/veille/sort";
import { toDayKey } from "~/shared/lib/dates";
import { userFacingDataError } from "~/shared/lib/user-error";
import { filterClientVeilleItems } from "~/shared/veille/client-filter";
import { collectVeilleDays, latestVeilleFeedDay } from "~/shared/veille/days";

const client = useSupabaseClient();
const user = useSupabaseUser();

const { data, pending, error, refresh } = await useAsyncData(
  () => `veille-${user.value?.id ?? "anon"}`,
  async () => {
    const uid = user.value?.id;
    if (!uid) return null;

    const { data: rows, error: qErr } = await client
      .from("veille_ia_items")
      .select("*")
      .order("feed_date", { ascending: false })
      .limit(800);

    if (qErr) throw new Error(userFacingDataError(qErr));

    const { data: saves } = await client.from("veille_ia_saves").select("item_id").eq("user_id", uid);
    const saved = new Set((saves ?? []).map((s) => s.item_id as string));
    const rowsClient = filterClientVeilleItems(rows ?? []);
    const items = rowsClient.map((row) => ({
      ...(row as VeilleItem),
      saved: saved.has(row.id as string),
    }));

    const days = collectVeilleDays(items);
    const day = latestVeilleFeedDay(items) ?? days[0] ?? toDayKey(new Date());
    return { items, days, day };
  },
  { watch: [() => user.value?.id], server: false },
);

const feed = computed(
  () => data.value ?? { items: [] as VeilleItem[], days: [] as string[], day: toDayKey(new Date()) },
);
</script>

<template>
  <div>
    <DsPageHeader
      title="Veille IA"
      description="Actualités sélectionnées. Filtrez par date, catégorie ou éditeur."
      :pending="pending && !data"
      :error="error?.message ?? null"
    />
    <VeilleWorkspace
      v-if="!error && data"
      :initial-items="feed.items"
      :initial-day="feed.day"
      :days="feed.days"
    />
    <DsEmptyState
      v-else-if="!error && !pending && user && feed.items.length === 0"
      class="mt-8"
      title="Aucune actualité"
      description="Le fil sera alimenté prochainement."
    />
  </div>
</template>
