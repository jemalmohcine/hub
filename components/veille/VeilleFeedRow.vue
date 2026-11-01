<script setup lang="ts">
import type { VeilleItem } from "~/shared/veille/types";
import { VEILLE_CATEGORY_LABELS, VEILLE_PROVIDER_LABELS, VEILLE_SEVERITY_LABELS } from "~/shared/veille/labels";
import { ExternalLink } from "lucide-vue-next";

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
  <article class="dh-surface flex gap-3 px-3 py-3 sm:px-4">
    <button
      type="button"
      class="dh-focus-ring min-w-0 flex-1 text-left"
      @click="$emit('open', item.id)"
    >
      <div class="flex flex-wrap items-center gap-1.5">
        <DsBadge :tone="severityTone(item.severity)" class="text-[0.65rem]">
          {{ VEILLE_SEVERITY_LABELS[item.severity] }}
        </DsBadge>
        <DsBadge tone="neutral" class="text-[0.65rem]">
          {{ VEILLE_CATEGORY_LABELS[item.category] }}
        </DsBadge>
        <span class="text-[0.65rem] text-muted-foreground">
          {{ VEILLE_PROVIDER_LABELS[item.provider] }}
        </span>
        <DsBadge v-if="item.saved" tone="info" class="text-[0.65rem]">Enregistré</DsBadge>
      </div>
      <h3 class="mt-1.5 text-[length:var(--dh-text-sm)] font-semibold leading-snug text-foreground">
        {{ item.title }}
      </h3>
      <p class="mt-1 line-clamp-2 text-[length:var(--dh-text-xs)] text-muted-foreground">{{ item.summary }}</p>
    </button>
    <a
      :href="item.link"
      target="_blank"
      rel="noopener noreferrer"
      class="dh-focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--dh-radius)] border border-border text-muted-foreground hover:text-primary"
      aria-label="Ouvrir la source"
      @click.stop
    >
      <ExternalLink class="h-4 w-4" />
    </a>
  </article>
</template>
