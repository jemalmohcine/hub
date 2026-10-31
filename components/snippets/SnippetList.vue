<script setup lang="ts">
import type { DevSnippet } from "~/shared/snippets/types";
import { Pin } from "lucide-vue-next";

defineProps<{ snippets: DevSnippet[]; selectedId: string | null }>();
const emit = defineEmits<{ select: [id: string]; copy: [id: string] }>();

async function copySnippet(item: DevSnippet) {
  await navigator.clipboard.writeText(item.content);
  emit("copy", item.id);
}
</script>

<template>
  <ul class="divide-y divide-border overflow-hidden rounded-[var(--dh-radius-lg)] border border-border bg-card">
    <li v-for="item in snippets" :key="item.id">
      <div
        class="flex gap-1"
        :class="selectedId === item.id ? 'bg-muted/80' : ''"
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 flex-col gap-1 px-3 py-3 text-left hover:bg-muted/50"
          @click="$emit('select', item.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="flex items-center gap-1 text-sm font-medium text-foreground">
              <Pin v-if="item.isPinned" class="h-3.5 w-3.5 text-primary" aria-label="Épinglé" />
              {{ item.title }}
            </span>
            <DsBadge tone="neutral">{{ item.language || "text" }}</DsBadge>
          </div>
          <p class="line-clamp-2 font-mono text-xs text-muted-foreground">{{ item.content }}</p>
        </button>
        <DsButton variant="ghost" size="sm" class="shrink-0 self-center" @click.stop="copySnippet(item)">
          Copier
        </DsButton>
      </div>
    </li>
  </ul>
</template>
