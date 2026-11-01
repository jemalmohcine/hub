<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tone?: "neutral" | "critical" | "warning" | "success" | "info";
  }>(),
  { tone: "neutral" },
);

const toneClass = computed(() => {
  const map = {
    neutral: "bg-muted text-foreground",
    critical: "bg-destructive/15 text-destructive",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
    info: "bg-primary/10 text-primary",
  };
  return map[props.tone];
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-[length:var(--text-xs,0.75rem)] font-medium"
    :class="toneClass"
  >
    <slot />
  </span>
</template>
