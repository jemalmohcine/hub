<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md";
    type?: "button" | "submit";
    disabled?: boolean;
  }>(),
  { variant: "primary", size: "md", type: "button" },
);

const classes = computed(() => {
  const base =
    "dh-focus-ring inline-flex items-center justify-center gap-2 rounded-[var(--dh-radius)] font-medium transition-[color,background,opacity] disabled:pointer-events-none disabled:opacity-50";
  const sizes = {
    sm: "px-3 py-1.5 text-[length:var(--dh-text-xs)]",
    md: "px-4 py-2 text-[length:var(--dh-text-sm)]",
  };
  const variants = {
    primary: "bg-primary text-primary-foreground hover:brightness-110",
    secondary: "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
    danger: "bg-destructive text-white hover:brightness-110",
  };
  return [base, sizes[props.size], variants[props.variant]].join(" ");
});
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled">
    <slot />
  </button>
</template>
