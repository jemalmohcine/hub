<script setup lang="ts">
import { formatTimestampMs, parseTimestampInput } from "~/shared/lib/dev-tool-utils";

const input = ref(String(Math.floor(Date.now() / 1000)));
const human = ref("");
const unixSec = ref("");
const unixMs = ref("");
const error = ref<string | null>(null);

function convert() {
  const res = parseTimestampInput(input.value);
  if (!res.ok) {
    error.value = res.error;
    human.value = "";
    unixSec.value = "";
    unixMs.value = "";
    return;
  }
  error.value = null;
  human.value = formatTimestampMs(res.ms);
  unixSec.value = String(Math.floor(res.ms / 1000));
  unixMs.value = String(res.ms);
}

function useNow() {
  input.value = String(Math.floor(Date.now() / 1000));
  convert();
}

onMounted(convert);
</script>

<template>
  <OutilPageShell title="Timestamp" description="Unix (s ou ms), ISO ou date locale lisible.">
    <DsInput v-model="input" placeholder="1698765432 ou 2024-10-31T12:00:00Z" class="font-mono text-xs" />
    <div class="mt-2 flex gap-2">
      <DsButton size="sm" @click="convert">Convertir</DsButton>
      <DsButton size="sm" variant="secondary" @click="useNow">Maintenant</DsButton>
    </div>
    <p v-if="error" class="mt-3 text-[length:var(--dh-text-sm)] text-destructive">{{ error }}</p>
    <dl v-else-if="human" class="mt-4 space-y-2 text-[length:var(--dh-text-sm)]">
      <div>
        <dt class="text-muted-foreground">Lecture</dt>
        <dd class="font-medium">{{ human }}</dd>
      </div>
      <div>
        <dt class="text-muted-foreground">Unix (s)</dt>
        <dd class="font-mono text-xs">{{ unixSec }}</dd>
      </div>
      <div>
        <dt class="text-muted-foreground">Unix (ms)</dt>
        <dd class="font-mono text-xs">{{ unixMs }}</dd>
      </div>
    </dl>
  </OutilPageShell>
</template>
