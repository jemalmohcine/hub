<script setup lang="ts">
import type { VeilleItem, VeilleCategory, VeilleProvider } from "~/shared/veille/types";
import { VEILLE_FILTER_CHIPS, VEILLE_PROVIDER_LABELS } from "~/shared/veille/labels";
import { sortVeilleItems } from "~/shared/veille/sort";
import { formatDate, addDaysIso } from "~/shared/lib/dates";

const props = defineProps<{
  initialItems: VeilleItem[];
  initialDay: string;
  days: string[];
}>();

const day = ref(props.initialDay);
const category = ref<"all" | VeilleCategory>("all");
const provider = ref<VeilleProvider | "all">("all");
const savedOnly = ref(false);
const q = ref("");
const selectedId = ref<string | null>(null);

const client = useSupabaseClient();

const filtered = computed(() => {
  const query = q.value.trim().toLowerCase();
  let list = props.initialItems.filter((i) => i.feed_date === day.value);
  if (category.value !== "all") list = list.filter((i) => i.category === category.value);
  if (provider.value !== "all") list = list.filter((i) => i.provider === provider.value);
  if (savedOnly.value) list = list.filter((i) => i.saved);
  if (query) {
    list = list.filter((i) =>
      `${i.title} ${i.summary} ${i.tags.join(" ")}`.toLowerCase().includes(query),
    );
  }
  return sortVeilleItems(list);
});

const selected = computed(() =>
  filtered.value.find((i) => i.id === selectedId.value) ??
  props.initialItems.find((i) => i.id === selectedId.value) ??
  null,
);

function shiftDay(delta: number) {
  day.value = addDaysIso(day.value, delta);
}

async function toggleSave(item: VeilleItem) {
  const user = useSupabaseUser();
  if (!user.value) return;
  if (item.saved) {
    await client.from("veille_ia_saves").delete().eq("user_id", user.value.id).eq("item_id", item.id);
    item.saved = false;
  } else {
    await client.from("veille_ia_saves").insert({ user_id: user.value.id, item_id: item.id });
    item.saved = true;
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <DsButton variant="ghost" size="sm" @click="shiftDay(-1)">←</DsButton>
      <span class="text-sm font-medium">{{ formatDate(day, "fr", "dayMonthYear") }}</span>
      <DsButton variant="ghost" size="sm" @click="shiftDay(1)">→</DsButton>
      <DsInput v-model="q" class="ml-auto max-w-xs flex-1" placeholder="Rechercher…" />
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="chip in VEILLE_FILTER_CHIPS"
        :key="chip.id"
        type="button"
        class="rounded-full px-3 py-1 text-xs transition-colors"
        :class="
          category === chip.id
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        "
        @click="category = chip.id"
      >
        {{ chip.label }}
      </button>
      <button
        type="button"
        class="rounded-full px-3 py-1 text-xs"
        :class="savedOnly ? 'bg-primary text-primary-foreground' : 'bg-muted'"
        @click="savedOnly = !savedOnly"
      >
        Enregistrés
      </button>
    </div>

    <select
      v-model="provider"
      class="max-w-xs rounded-[var(--dh-radius)] border border-border bg-card px-3 py-2 text-sm"
    >
      <option value="all">Tous les éditeurs</option>
      <option v-for="(label, id) in VEILLE_PROVIDER_LABELS" :key="id" :value="id">
        {{ label }}
      </option>
    </select>

    <DsEmptyState
      v-if="filtered.length === 0"
      title="Rien pour ce jour"
      description="Essayez une autre date ou assouplissez les filtres."
    />

    <VeilleFeedRow
      v-for="item in filtered"
      :key="item.id"
      :item="item"
      @open="selectedId = $event"
    />

    <DsModal :open="Boolean(selected)" :title="selected?.title" @close="selectedId = null">
      <template v-if="selected">
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-[length:var(--dh-text-lg)] font-semibold leading-snug">{{ selected.title }}</h2>
          <DsButton variant="ghost" size="sm" @click="selectedId = null">Fermer</DsButton>
        </div>
        <p class="mt-2 text-[length:var(--dh-text-sm)] text-muted-foreground">{{ selected.summary }}</p>
        <section v-if="selected.quoi" class="mt-4">
          <h3 class="text-[length:var(--dh-text-sm)] font-medium">Quoi</h3>
          <ul class="mt-1 list-disc pl-5 text-[length:var(--dh-text-sm)] text-muted-foreground">
            <li v-for="(line, idx) in selected.quoi.split('\n').filter(Boolean)" :key="idx">
              {{ line.replace(/^•\s*/, "") }}
            </li>
          </ul>
        </section>
        <section v-if="selected.impact" class="mt-4">
          <h3 class="text-[length:var(--dh-text-sm)] font-medium">Impact</h3>
          <ul class="mt-1 list-disc pl-5 text-[length:var(--dh-text-sm)] text-muted-foreground">
            <li v-for="(line, idx) in selected.impact.split('\n').filter(Boolean)" :key="idx">
              {{ line.replace(/^•\s*/, "") }}
            </li>
          </ul>
        </section>
        <div class="mt-4 flex flex-wrap gap-2">
          <DsButton variant="secondary" size="sm" @click="toggleSave(selected)">
            {{ selected.saved ? "Retirer" : "Enregistrer" }}
          </DsButton>
          <a
            :href="selected.link"
            target="_blank"
            rel="noopener noreferrer"
            class="dh-focus-ring inline-flex items-center text-[length:var(--dh-text-sm)] text-primary underline"
          >
            Source externe
          </a>
        </div>
      </template>
    </DsModal>
  </div>
</template>
