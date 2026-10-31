<script setup lang="ts">
import type { DevSnippet } from "~/shared/snippets/types";
import { Check, Pin } from "lucide-vue-next";

defineProps<{ snippets: DevSnippet[]; selectedId: string | null; copiedId?: string | null }>();
const emit = defineEmits<{ select: [id: string]; copy: [id: string] }>();

const { showToast } = useToast();

async function tapSnippet(item: DevSnippet) {
  try {
    await navigator.clipboard.writeText(item.content);
    emit("copy", item.id);
    showToast(`« ${item.title} » copié`);
  } catch {
    emit("select", item.id);
  }
}
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li v-for="item in snippets" :key="item.id">
      <button
        type="button"
        class="dh-focus-ring dh-surface flex w-full flex-col gap-2 px-4 py-3 text-left transition-transform active:scale-[0.99]"
        :class="selectedId === item.id ? 'ring-2 ring-primary/30' : ''"
        @click="tapSnippet(item)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
            <Pin v-if="item.isPinned" class="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Épinglé" />
            <span class="truncate">{{ item.title }}</span>
          </span>
          <DsBadge tone="neutral">{{ item.language || "text" }}</DsBadge>
        </div>
        <p class="line-clamp-2 font-mono text-[length:var(--dh-text-xs)] text-muted-foreground">{{ item.content }}</p>
        <span class="flex items-center gap-1 text-[length:var(--dh-text-xs)] text-primary">
          <Check v-if="copiedId === item.id" class="h-3.5 w-3.5" />
          {{ copiedId === item.id ? "Copié" : "Toucher pour copier" }}
        </span>
      </button>
    </li>
  </ul>
</template>
