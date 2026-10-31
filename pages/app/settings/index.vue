<script setup lang="ts">
import { profileFullName } from "~/shared/core/auth/types";

const { hubUser } = useHubUser();

const sections = [
  { href: "/app/settings/account", title: "Compte", description: "Prénom, nom et informations personnelles" },
  { href: "/app/settings/appearance", title: "Langue et apparence", description: "Thème et notifications" },
  { href: "/app/settings/security", title: "Sécurité", description: "Mot de passe et session" },
  { href: "/app/settings/billing", title: "Abonnement", description: "Plan Free ou Pro" },
  { href: "/app/settings/modules", title: "Modules", description: "Accès par module" },
] as const;
</script>

<template>
  <div>
    <DsPageHeader title="Paramètres" description="Gère ton compte et ton hub en un seul endroit." />
    <DsCard v-if="hubUser" class="mb-6 p-4">
      <p class="font-semibold">{{ profileFullName(hubUser.profile) || hubUser.email.split('@')[0] }}</p>
      <p class="text-sm text-muted-foreground">{{ hubUser.email }}</p>
      <p class="mt-1 text-xs capitalize text-muted-foreground">Plan {{ hubUser.subscription?.plan ?? "free" }}</p>
    </DsCard>
    <div class="flex flex-col gap-2">
      <NuxtLink
        v-for="section in sections"
        :key="section.href"
        :to="section.href"
        class="dh-focus-ring dh-surface flex items-center justify-between px-4 py-3"
      >
        <span>
          <span class="block font-medium">{{ section.title }}</span>
          <span class="text-sm text-muted-foreground">{{ section.description }}</span>
        </span>
        <span aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </div>
</template>
