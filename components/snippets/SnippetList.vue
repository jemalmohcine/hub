<script setup lang="ts">
import type { DevSnippet } from "~/shared/snippets/types";

defineProps<{ snippets: DevSnippet[]; selectedId: string | null }>();
defineEmits<{ select: [id: string]; copy: [id: string] }>();
</script>

<template>
  <ul class="divide-y divide-border rounded-[var(--dh-radius)] border border-border">
    <li v-for="item in snippets" :key="item.id">
      <button
        type="button"
        class="flex w-full flex-col gap-1 px-3 py-3 text-left hover:bg-muted/50"
        :class="selectedId === item.id ? 'bg-muted' : ''"
        @click="$emit('select', item.id)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium">{{ item.title }}</span>
          <DsBadge tone="neutral">{{ item.language || "text" }}</DsBadge>
        </div>
        <p class="line-clamp-2 font-mono text-xs text-muted-foreground">{{ item.content }}</p>
      </button>
    </li>
  </ul>
</template>
