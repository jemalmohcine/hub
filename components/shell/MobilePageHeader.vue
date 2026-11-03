<script setup lang="ts">
defineProps<{
  title: string;
}>();

defineEmits<{ add: [] }>();
</script>

<template>
  <header
    data-testid="mobile-page-header"
    class="mobile-page-header lg:hidden"
  >
    <div class="mobile-page-header__inner">
      <NuxtLink to="/app/overview" class="mobile-page-header__logo" aria-label="Accueil hub">
        <svg
          class="mobile-page-header__logo-svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="32" height="32" rx="8" class="mobile-page-header__logo-bg" />
          <path
            d="M10 8h12v6h-6v14h-6V8z"
            class="mobile-page-header__logo-fg"
          />
          <circle cx="22" cy="11" r="2.25" class="mobile-page-header__logo-fg" />
        </svg>
      </NuxtLink>
      <h1 class="mobile-page-header__title">
        {{ title }}
      </h1>
      <button
        type="button"
        class="mobile-page-header__add"
        data-testid="snippet-add-header"
        aria-label="Nouveau snippet"
        @click="$emit('add')"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="square"
          />
        </svg>
      </button>
    </div>
  </header>
</template>
