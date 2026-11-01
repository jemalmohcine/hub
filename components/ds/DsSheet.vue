<script setup lang="ts">
defineOptions({ inheritAttrs: false });
defineProps<{ open: boolean; title?: string }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      v-bind="$attrs"
      class="fixed inset-0 z-[60] flex flex-col justify-end bg-black/45 sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="title || 'Panneau'"
      @click.self="$emit('close')"
    >
      <div
        class="dh-sheet max-h-[92dvh] overflow-y-auto rounded-t-[var(--dh-radius-xl)] border border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl sm:mx-auto sm:max-w-lg sm:rounded-[var(--dh-radius-xl)]"
      >
        <div v-if="title" class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-[length:var(--dh-text-base)] font-semibold">{{ title }}</h2>
          <button type="button" class="dh-focus-ring rounded-lg px-2 py-1 text-sm text-muted-foreground" @click="$emit('close')">
            Fermer
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dh-sheet {
  animation: dh-sheet-up 0.22s ease-out;
}
@keyframes dh-sheet-up {
  from {
    transform: translateY(12px);
    opacity: 0.6;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
