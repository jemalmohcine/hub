<script setup lang="ts">
import type { VeilleItem } from "~/shared/veille/types";
import { sortVeilleItems } from "~/shared/veille/sort";
import { toDayKey } from "~/shared/lib/dates";

definePageMeta({ middleware: [] });

const client = useSupabaseClient();
const user = useSupabaseUser();

const { data } = await useAsyncData("veille", async () => {
  const uid = user.value?.id;
  if (!uid) return { items: [] as VeilleItem[], days: [] as string[], day: toDayKey(new Date()) };

  const { data: rows, error } = await client
    .from("veille_ia_items")
    .select("*")
    .order("feed_date", { ascending: false })
    .limit(800);

  if (error) return { items: [], days: [], day: toDayKey(new Date()) };

  const { data: saves } = await client
    .from("veille_ia_saves")
    .select("item_id")
    .eq("user_id", uid);

  const saved = new Set((saves ?? []).map((s) => s.item_id as string));
  const items = (rows ?? []).map((row) => ({
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

  const day = days[0] ?? toDayKey(new Date());
  return { items, days, day };
});

const feed = computed(() => data.value ?? { items: [], days: [], day: toDayKey(new Date()) });
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Veille IA</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Fil quotidien — titres scannables, détail en un clic.
    </p>
    <VeilleWorkspace
      class="mt-6"
      :initial-items="feed.items"
      :initial-day="feed.day"
      :days="feed.days"
    />
  </div>
</template>
