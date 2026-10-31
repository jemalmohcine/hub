<script setup lang="ts">
import type { DevSnippetCategory } from "~/shared/snippets/types";

defineProps<{
  categories: DevSnippetCategory[];
  activeId: string | null;
}>();
defineEmits<{ select: [id: string | null]; create: [] }>();
</script>

<template>
  <aside class="space-y-2">
    <DsButton variant="secondary" size="sm" class="w-full" @click="$emit('create')">
      Nouveau dossier
    </DsButton>
    <button
      type="button"
      class="block w-full rounded-lg px-3 py-2 text-left text-sm"
      :class="!activeId ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
      @click="$emit('select', null)"
    >
      Tous
    </button>
    <button
      v-for="cat in categories"
      :key="cat.id"
      type="button"
      class="block w-full rounded-lg px-3 py-2 text-left text-sm"
      :class="activeId === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
      @click="$emit('select', cat.id)"
    >
      {{ cat.name }}
    </button>
  </aside>
</template>
