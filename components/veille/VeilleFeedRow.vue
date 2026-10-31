<script setup lang="ts">
import type { VeilleItem } from "~/shared/veille/types";
import { VEILLE_PROVIDER_LABELS, VEILLE_SEVERITY_LABELS } from "~/shared/veille/labels";

defineProps<{
  item: VeilleItem;
}>();
defineEmits<{ open: [id: string] }>();

function severityTone(sev: VeilleItem["severity"]) {
  if (sev === "critique") return "critical";
  if (sev === "elevee") return "warning";
  return "neutral";
}
</script>

<template>
  <button
    type="button"
    class="flex w-full flex-col gap-1 border-b border-border px-1 py-3 text-left transition-colors hover:bg-muted/50"
    @click="$emit('open', item.id)"
  >
    <div class="flex flex-wrap items-center gap-2">
      <DsBadge :tone="severityTone(item.severity)">
        {{ VEILLE_SEVERITY_LABELS[item.severity] }}
      </DsBadge>
      <span class="text-xs text-muted-foreground">
        {{ VEILLE_PROVIDER_LABELS[item.provider] }}
      </span>
      <DsBadge v-if="item.saved" tone="info">Enregistré</DsBadge>
    </div>
    <h3 class="text-sm font-semibold leading-snug">{{ item.title }}</h3>
    <p class="line-clamp-2 text-sm text-muted-foreground">{{ item.summary }}</p>
  </button>
</template>
