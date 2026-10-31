<script setup lang="ts">
import { formatJsonPretty, minifyJson } from "~/shared/lib/dev-tool-utils";

const input = ref('{\n  "exemple": true\n}');
const output = ref("");
const error = ref<string | null>(null);

function runPretty() {
  const res = formatJsonPretty(input.value);
  if (!res.ok) {
    error.value = res.error;
    output.value = "";
    return;
  }
  error.value = null;
  output.value = res.text;
}

function runMinify() {
  const res = minifyJson(input.value);
  if (!res.ok) {
    error.value = res.error;
    output.value = "";
    return;
  }
  error.value = null;
  output.value = res.text;
}

onMounted(runPretty);
</script>

<template>
  <OutilPageShell title="JSON" description="Collez du JSON, formatez ou compactez. Validation immédiate.">
    <DsTextarea v-model="input" :rows="8" class="font-mono text-xs" placeholder="{}" />
    <div class="mt-3 flex flex-wrap gap-2">
      <DsButton size="sm" @click="runPretty">Formater</DsButton>
      <DsButton size="sm" variant="secondary" @click="runMinify">Minifier</DsButton>
    </div>
    <p v-if="error" class="mt-3 text-[length:var(--dh-text-sm)] text-destructive">{{ error }}</p>
    <DsTextarea v-else v-model="output" :rows="10" readonly class="mt-3 font-mono text-xs" />
  </OutilPageShell>
</template>
