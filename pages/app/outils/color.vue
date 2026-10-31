<script setup lang="ts">
import { parseColorInput } from "~/shared/lib/dev-tool-utils";

const input = ref("#6d28d9");
const preview = ref("#6d28d9");
const rgb = ref("");
const hsl = ref("");
const error = ref<string | null>(null);

function convert() {
  const res = parseColorInput(input.value);
  if (!res.ok) {
    error.value = res.error;
    return;
  }
  error.value = null;
  preview.value = res.color.hex;
  rgb.value = res.color.rgb;
  hsl.value = res.color.hsl;
}

onMounted(convert);
watch(input, convert);
</script>

<template>
  <OutilPageShell title="Couleurs" description="Convertissez hex ↔ RGB ↔ HSL.">
    <div class="flex items-center gap-3">
      <div
        class="h-12 w-12 shrink-0 rounded-[var(--dh-radius-lg)] border border-border shadow-sm"
        :style="{ backgroundColor: preview }"
        aria-hidden="true"
      />
      <DsInput v-model="input" placeholder="#6d28d9 ou rgb(109, 40, 217)" class="font-mono text-xs" />
    </div>
    <p v-if="error" class="mt-3 text-[length:var(--dh-text-sm)] text-destructive">{{ error }}</p>
    <dl v-else class="mt-4 space-y-2 text-[length:var(--dh-text-sm)]">
      <div>
        <dt class="text-muted-foreground">Hex</dt>
        <dd class="font-mono text-xs">{{ preview }}</dd>
      </div>
      <div>
        <dt class="text-muted-foreground">RGB</dt>
        <dd class="font-mono text-xs">{{ rgb }}</dd>
      </div>
      <div>
        <dt class="text-muted-foreground">HSL</dt>
        <dd class="font-mono text-xs">{{ hsl }}</dd>
      </div>
    </dl>
  </OutilPageShell>
</template>
