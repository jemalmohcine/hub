<script setup lang="ts">
import { Braces, Clock, Hash, KeyRound, Palette, ScanSearch, Wrench } from "lucide-vue-next";

const tools = [
  { href: "/app/outils/json", title: "JSON", hint: "Formater et valider", icon: Braces },
  { href: "/app/outils/encode", title: "Base64 / URL", hint: "Encoder et décoder", icon: Wrench },
  { href: "/app/outils/jwt", title: "JWT", hint: "Décoder un jeton", icon: KeyRound },
  { href: "/app/outils/regex", title: "Regex", hint: "Tester une expression", icon: ScanSearch },
  { href: "/app/outils/uuid", title: "UUID / hash", hint: "Identifiants et empreintes", icon: Hash },
  { href: "/app/outils/timestamp", title: "Timestamp", hint: "Unix ↔ date locale", icon: Clock },
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
    <div class="grid gap-3 sm:grid-cols-2">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.href"
        :to="tool.href"
        class="dh-focus-ring dh-surface flex items-start gap-3 px-4 py-4 transition-colors hover:border-primary/25"
      >
        <component :is="tool.icon" class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p class="font-semibold text-foreground">{{ tool.title }}</p>
          <p class="text-[length:var(--dh-text-xs)] text-muted-foreground">{{ tool.hint }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
