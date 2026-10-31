<script setup lang="ts">
import { testRegex } from "~/shared/lib/dev-tool-utils";

const pattern = ref("");
const flags = ref("g");
const sample = ref("");
const matches = ref<string[]>([]);
const error = ref<string | null>(null);

function runTest() {
  const res = testRegex(pattern.value, flags.value, sample.value);
  if (!res.ok) {
    error.value = res.error;
    matches.value = [];
    return;
  }
  error.value = null;
  matches.value = res.matches;
}
</script>

<template>
  <OutilPageShell title="Regex" description="Testez une expression sur un échantillon.">
    <DsInput v-model="pattern" placeholder="Expression" class="font-mono text-xs" />
    <DsInput v-model="flags" placeholder="Flags (ex. g, i)" class="mt-2 max-w-[10rem] font-mono text-xs" />
    <DsTextarea v-model="sample" :rows="6" class="mt-3 font-mono text-xs" placeholder="Texte à analyser" />
    <DsButton size="sm" class="mt-3" @click="runTest">Tester</DsButton>
    <p v-if="error" class="mt-3 text-[length:var(--dh-text-sm)] text-destructive">{{ error }}</p>
    <ul v-else-if="matches.length" class="mt-3 list-disc pl-5 text-[length:var(--dh-text-sm)]">
      <li v-for="(m, i) in matches" :key="i" class="font-mono text-xs">{{ m }}</li>
    </ul>
    <p v-else-if="pattern && sample" class="mt-3 text-[length:var(--dh-text-sm)] text-muted-foreground">
      Aucune correspondance.
    </p>
  </OutilPageShell>
</template>
