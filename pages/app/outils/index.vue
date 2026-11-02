<script setup lang="ts">
import { Braces, Clock, Hash, KeyRound, Palette, ScanSearch, Wrench } from "lucide-vue-next";

const showMore = ref(false);

const primaryTools = [
  { href: "/app/outils/json", title: "JSON", hint: "Formater et valider", icon: Braces },
  { href: "/app/outils/jwt", title: "JWT", hint: "Décoder un jeton", icon: KeyRound },
  { href: "/app/outils/encode", title: "Base64 / URL", hint: "Encoder et décoder", icon: Wrench },
  { href: "/app/outils/timestamp", title: "Timestamp", hint: "Unix et date locale", icon: Clock },
] as const;

const moreTools = [
  { href: "/app/outils/regex", title: "Regex", hint: "Tester une expression", icon: ScanSearch },
  { href: "/app/outils/uuid", title: "UUID / hash", hint: "Identifiants et empreintes", icon: Hash },
  { href: "/app/outils/color", title: "Couleurs", hint: "Hex, RGB, HSL", icon: Palette },
] as const;
</script>

<template>
  <div>
    <DsPageHeader
      compact
      title="Outils"
      description="Utilitaires du quotidien, 100 % côté navigateur. Aucune donnée envoyée."
    />

    <ul class="flex flex-col gap-1">
      <li v-for="tool in primaryTools" :key="tool.href">
        <NuxtLink
          :to="tool.href"
          class="dh-focus-ring flex min-h-11 items-center gap-3 rounded-[var(--dh-radius-lg)] border border-border bg-card px-3 py-2.5 transition-colors active:bg-muted"
        >
          <component :is="tool.icon" class="h-5 w-5 shrink-0 text-primary" />
          <span class="min-w-0 flex-1">
            <span class="block font-medium text-foreground">{{ tool.title }}</span>
            <span class="block text-[length:var(--dh-text-xs)] text-muted-foreground">{{ tool.hint }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>

    <button
      type="button"
      class="dh-focus-ring mt-4 flex min-h-11 w-full items-center justify-between rounded-[var(--dh-radius-lg)] border border-dashed border-border bg-card/60 px-3 py-2.5 text-left text-[length:var(--dh-text-sm)] font-medium text-foreground"
      :aria-expanded="showMore"
      @click="showMore = !showMore"
    >
      Plus d'outils
      <span class="text-muted-foreground">{{ showMore ? "−" : "+" }}</span>
    </button>

    <ul v-if="showMore" class="mt-2 flex flex-col gap-1">
      <li v-for="tool in moreTools" :key="tool.href">
        <NuxtLink
          :to="tool.href"
          class="dh-focus-ring flex min-h-11 items-center gap-3 rounded-[var(--dh-radius-lg)] border border-border bg-card px-3 py-2.5 transition-colors active:bg-muted"
        >
          <component :is="tool.icon" class="h-5 w-5 shrink-0 text-primary" />
          <span class="min-w-0 flex-1">
            <span class="block font-medium text-foreground">{{ tool.title }}</span>
            <span class="block text-[length:var(--dh-text-xs)] text-muted-foreground">{{ tool.hint }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
