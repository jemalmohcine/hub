<script setup lang="ts">
import {
  decodeBase64,
  decodeURIComponentSafe,
  encodeBase64,
  encodeURIComponentSafe,
} from "~/shared/lib/dev-tool-utils";

const mode = ref<"base64" | "url">("base64");
const input = ref("");
const output = ref("");
const error = ref<string | null>(null);

function encode() {
  error.value = null;
  output.value = mode.value === "base64" ? encodeBase64(input.value) : encodeURIComponentSafe(input.value);
}

function decode() {
  const res =
    mode.value === "base64" ? decodeBase64(input.value) : decodeURIComponentSafe(input.value);
  if (!res.ok) {
    error.value = res.error;
    output.value = "";
    return;
  }
  error.value = null;
  output.value = res.text;
}
</script>

<template>
  <OutilPageShell title="Base64 / URL" description="Encodez ou décodez sans quitter l’app.">
    <div class="mb-3 flex gap-2">
      <DsButton size="sm" :variant="mode === 'base64' ? 'primary' : 'secondary'" @click="mode = 'base64'">
        Base64
      </DsButton>
      <DsButton size="sm" :variant="mode === 'url' ? 'primary' : 'secondary'" @click="mode = 'url'">
        URL
      </DsButton>
    </div>
    <DsTextarea v-model="input" :rows="6" class="font-mono text-xs" placeholder="Texte source" />
    <div class="mt-3 flex flex-wrap gap-2">
      <DsButton size="sm" @click="encode">Encoder</DsButton>
      <DsButton size="sm" variant="secondary" @click="decode">Décoder</DsButton>
    </div>
    <p v-if="error" class="mt-3 text-[length:var(--dh-text-sm)] text-destructive">{{ error }}</p>
    <DsTextarea v-model="output" :rows="6" readonly class="mt-3 font-mono text-xs" placeholder="Résultat" />
  </OutilPageShell>
</template>
