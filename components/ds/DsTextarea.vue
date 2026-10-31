<script setup lang="ts">
defineProps<{ modelValue?: string; rows?: number; placeholder?: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <textarea
    :rows="rows || 4"
    class="w-full rounded-[var(--dh-radius)] border border-border bg-card px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
