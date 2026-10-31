<script setup lang="ts">
import type { VeilleItem } from "~/shared/veille/types";
import { sortVeilleItems } from "~/shared/veille/sort";
import { toDayKey } from "~/shared/lib/dates";
import { userFacingDataError } from "~/shared/lib/user-error";
import { filterClientVeilleItems } from "~/shared/veille/client-filter";

const client = useSupabaseClient();
const user = useSupabaseUser();

const { data, pending, error, refresh } = await useAsyncData("veille", async () => {
  const uid = user.value?.id;
  if (!uid) return { items: [] as VeilleItem[], days: [] as string[], day: toDayKey(new Date()) };

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

  const days: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!seen.has(item.feed_date)) {
      seen.add(item.feed_date);
      days.push(item.feed_date);
    }
  }
  return { items, days, day: days[0] ?? toDayKey(new Date()) };
});

const feed = computed(() => data.value ?? { items: [], days: [], day: toDayKey(new Date()) });
</script>

<template>
  <div>
    <DsPageHeader
      title="Veille IA"
      description="Actualités sélectionnées chaque jour. Ouvrez une entrée pour le détail."
      :pending="pending"
      :error="error?.message ?? null"
    />
    <VeilleWorkspace
      v-if="!error"
      :initial-items="feed.items"
      :initial-day="feed.day"
      :days="feed.days"
    />
  </div>
</template>
