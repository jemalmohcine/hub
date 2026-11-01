<script setup lang="ts">
import { decodeJwt } from "~/shared/lib/dev-tool-utils";

const token = ref("");
const headerJson = ref("");
const payloadJson = ref("");
const error = ref<string | null>(null);

function runDecode() {
  const res = decodeJwt(token.value);
  if (!res.ok) {
    error.value = res.error;
    headerJson.value = "";
    payloadJson.value = "";
    return;
  }
  error.value = null;
  headerJson.value = JSON.stringify(res.parts.header, null, 2);
  payloadJson.value = JSON.stringify(res.parts.payload, null, 2);
}
</script>

<template>
  <OutilPageShell title="JWT" description="Décodage local du header et du payload (sans vérifier la signature).">
    <DsTextarea v-model="token" :rows="4" class="font-mono text-xs break-all" placeholder="eyJhbG…" />
    <DsButton size="sm" class="mt-3" @click="runDecode">Décoder</DsButton>
    <p v-if="error" class="mt-3 text-[length:var(--dh-text-sm)] text-destructive">{{ error }}</p>
    <template v-if="headerJson">
      <p class="mt-4 text-[length:var(--dh-text-xs)] font-semibold uppercase text-muted-foreground">Header</p>
      <DsTextarea v-model="headerJson" readonly :rows="5" class="mt-1 font-mono text-xs" />
      <p class="mt-4 text-[length:var(--dh-text-xs)] font-semibold uppercase text-muted-foreground">Payload</p>
      <DsTextarea v-model="payloadJson" readonly :rows="8" class="mt-1 font-mono text-xs" />
    </template>
  </OutilPageShell>
</template>
