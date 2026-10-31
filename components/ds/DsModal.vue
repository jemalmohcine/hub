<script setup lang="ts">
defineProps<{ open: boolean; title?: string }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      :aria-label="title || 'Détail'"
      @click.self="$emit('close')"
    >
      <div class="dh-surface max-h-[85vh] w-full max-w-lg overflow-y-auto p-5">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
