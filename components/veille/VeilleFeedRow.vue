<script setup lang="ts">
import type { VeilleItem } from "~/shared/veille/types";
import { VEILLE_CATEGORY_LABELS, VEILLE_PROVIDER_LABELS, VEILLE_SEVERITY_LABELS } from "~/shared/veille/labels";
import { ExternalLink } from "lucide-vue-next";

defineProps<{
  item: VeilleItem;
  savedAsSnippet: boolean;
  savingSnippet?: boolean;
}>();

defineEmits<{ open: [id: string]; "save-snippet": [] }>();

function severityTone(sev: VeilleItem["severity"]) {
  if (sev === "critique") return "critical";
  if (sev === "elevee") return "warning";
  return "neutral";
}
</script>

<template>
  <article class="dh-surface flex flex-col gap-2 px-3 py-3 sm:px-4">
    <button
      type="button"
      class="dh-focus-ring min-w-0 text-left"
      @click="$emit('open', item.id)"
    >
      <div class="flex flex-wrap items-center gap-1.5">
        <DsBadge :tone="severityTone(item.severity)" class="text-[0.65rem]">
          {{ VEILLE_SEVERITY_LABELS[item.severity] ?? item.severity }}
        </DsBadge>
        <DsBadge tone="neutral" class="text-[0.65rem]">
          {{ VEILLE_CATEGORY_LABELS[item.category] ?? item.category }}
        </DsBadge>
        <span class="text-[0.65rem] text-muted-foreground">
          {{ VEILLE_PROVIDER_LABELS[item.provider] ?? item.provider }}
        </span>
        <DsBadge v-if="item.saved" tone="info" class="text-[0.65rem]">Enregistré</DsBadge>
        <DsBadge v-if="savedAsSnippet" tone="success" class="text-[0.65rem]">Snippet</DsBadge>
      </div>
      <h3 class="mt-1.5 text-[length:var(--dh-text-sm)] font-semibold leading-snug text-foreground">
        {{ item.title }}
      </h3>
      <p class="mt-1 line-clamp-2 text-[length:var(--dh-text-xs)] text-muted-foreground">{{ item.summary }}</p>
    </button>
    <div class="flex gap-2">
      <button
        type="button"
        data-testid="veille-save-snippet-card"
        class="dh-focus-ring inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[var(--dh-radius-lg)] border border-border bg-muted px-3 text-[length:var(--dh-text-xs)] font-medium text-foreground disabled:cursor-default disabled:opacity-70"
        :disabled="savedAsSnippet || savingSnippet"
        @click.stop="$emit('save-snippet')"
      >
        {{ savedAsSnippet ? "Déjà sauvé" : savingSnippet ? "Enregistrement…" : "Sauver en snippet" }}
      </button>
      <a
        :href="item.link"
        target="_blank"
        rel="noopener noreferrer"
        class="dh-focus-ring inline-flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-[var(--dh-radius-lg)] border border-border text-muted-foreground hover:text-primary"
        aria-label="Ouvrir la source"
        @click.stop
      >
        <ExternalLink class="h-4 w-4" />
      </a>
    </div>
  </article>
</template>
