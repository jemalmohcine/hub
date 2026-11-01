<script setup lang="ts">
import { hashText, randomUuid } from "~/shared/lib/dev-tool-utils";

const uuid = ref("");
const hashInput = ref("");
const hashSha256 = ref("");
const hashSha1 = ref("");

function genUuid() {
  uuid.value = randomUuid();
}

async function runHash() {
  hashSha256.value = await hashText(hashInput.value, "SHA-256");
  hashSha1.value = await hashText(hashInput.value, "SHA-1");
}

onMounted(genUuid);
</script>

<template>
  <OutilPageShell title="UUID / hash" description="Générez un UUID v4 et des empreintes SHA.">
    <DsInput v-model="uuid" readonly class="font-mono text-xs" />
    <DsButton size="sm" class="mt-2" @click="genUuid">Nouveau UUID</DsButton>
    <DsTextarea v-model="hashInput" :rows="4" class="mt-6 font-mono text-xs" placeholder="Texte à hacher" />
    <DsButton size="sm" class="mt-2" variant="secondary" @click="runHash">Calculer les hash</DsButton>
    <div v-if="hashSha256" class="mt-3 space-y-2 text-[length:var(--dh-text-xs)]">
      <p><span class="text-muted-foreground">SHA-256</span><br /><code class="break-all font-mono">{{ hashSha256 }}</code></p>
      <p><span class="text-muted-foreground">SHA-1</span><br /><code class="break-all font-mono">{{ hashSha1 }}</code></p>
    </div>
  </OutilPageShell>
</template>
