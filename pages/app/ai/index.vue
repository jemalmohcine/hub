<script setup lang="ts">
import type { VeilleItem } from "~/shared/veille/types";
import { toDayKey } from "~/shared/lib/dates";
import { userFacingDataError } from "~/shared/lib/user-error";
import { filterClientVeilleItems } from "~/shared/veille/client-filter";
import { collectVeilleDays, filterVeilleLastSevenDays, latestVeilleFeedDay } from "~/shared/veille/days";
import { mapVeilleRow } from "~/shared/veille/map-row";

const client = useSupabaseClient();
const authUserId = useAuthUserId();

const { data, pending, error, refresh } = await useAsyncData(
  () => `veille-${authUserId.value ?? "anon"}`,
  async () => {
    await ensureAuthUserId();

    const { data: rows, error: qErr } = await client
      .from("veille_ia_items")
      .select("*")
      .order("feed_date", { ascending: false })
      .limit(800);

    if (qErr) throw new Error(userFacingDataError(qErr));

    const uid = authUserId.value;
    let saved = new Set<string>();
    if (uid) {
      const { data: saves } = await client.from("veille_ia_saves").select("item_id").eq("user_id", uid);
      saved = new Set((saves ?? []).map((s) => s.item_id as string));
    }

    const rowsClient = filterClientVeilleItems((rows ?? []).map((row) => mapVeilleRow(row as Record<string, unknown>)));
    const items = rowsClient.map((row) => ({
      ...row,
      saved: saved.has(row.id),
    }));

    const inWindow = filterVeilleLastSevenDays(items);
    const days = collectVeilleDays(inWindow);
    const day = latestVeilleFeedDay(inWindow) ?? days[0] ?? toDayKey(new Date());
    return { items: inWindow, days, day };
  },
  { watch: [() => authUserId.value], server: false },
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
      v-if="!error && data && feed.items.length > 0"
      :initial-items="feed.items"
      :initial-day="feed.day"
      :days="feed.days"
    />
    <DsEmptyState
      v-else-if="!error && !pending && data && feed.items.length === 0"
      class="mt-8"
      title="Aucune actualité"
      description="Le fil sera alimenté prochainement."
    />
  </div>
</template>
