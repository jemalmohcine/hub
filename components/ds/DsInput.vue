<script setup lang="ts">
defineProps<{ modelValue?: string; placeholder?: string; type?: string; ariaLabel?: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();

const inputRef = ref<HTMLInputElement | null>(null);

defineExpose({
  focus: () => inputRef.value?.focus(),
});
</script>

<template>
  <input
    ref="inputRef"
    :type="type || 'text'"
    :aria-label="ariaLabel || placeholder"
    class="dh-focus-ring w-full rounded-[var(--dh-radius)] border border-border bg-card px-3 py-2 text-[length:var(--dh-text-sm)] transition-colors placeholder:text-muted-foreground"
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
