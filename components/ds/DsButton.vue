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
    "inline-flex items-center justify-center gap-2 rounded-[var(--dh-radius)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-muted text-foreground hover:bg-muted/80",
    ghost: "hover:bg-muted",
    danger: "bg-destructive text-white hover:opacity-90",
  };
  return [base, sizes[props.size], variants[props.variant]].join(" ");
});
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled">
    <slot />
  </button>
</template>
