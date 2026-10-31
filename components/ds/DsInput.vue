<script setup lang="ts">
defineProps<{ modelValue?: string; placeholder?: string; type?: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <input
    :type="type || 'text'"
    class="w-full rounded-[var(--dh-radius)] border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
