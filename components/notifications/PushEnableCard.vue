<script setup lang="ts">
const config = useRuntimeConfig();
const vapidKey = computed(() => config.public.vapidPublicKey as string);

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

type Status = "unsupported" | "denied" | "off" | "on" | "loading";
const status = ref<Status>("loading");
const loading = ref(false);

onMounted(async () => {
  if (!vapidKey.value || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    status.value = "unsupported";
    return;
  }
  if (Notification.permission === "denied") {
    status.value = "denied";
    return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    status.value = sub ? "on" : "off";
  } catch {
    status.value = "off";
  }
});

async function enable() {
  if (!vapidKey.value) return;
  loading.value = true;
  try {
    const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("/sw.js"));
    await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      status.value = "denied";
      return;
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey.value),
    });
    const json = sub.toJSON();
    await $fetch("/api/notifications/push", {
      method: "POST",
      body: {
        endpoint: json.endpoint,
        keys: json.keys,
        userAgent: navigator.userAgent,
      },
    });
    status.value = "on";
  } finally {
    loading.value = false;
  }
}

async function disable() {
  loading.value = true;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await $fetch("/api/notifications/push", { method: "DELETE", query: { endpoint: sub.endpoint } }).catch(() => null);
      await sub.unsubscribe();
    }
    status.value = "off";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <DsCard v-if="status !== 'loading'" class="p-4">
    <h3 class="text-[length:var(--dh-text-sm)] font-semibold">Sur mon téléphone</h3>
    <p class="mt-1 text-[length:var(--dh-text-sm)] text-muted-foreground">
      {{
        status === "on"
          ? "Alertes urgentes activées (plan Pro)."
          : status === "denied"
            ? "Permission refusée dans le navigateur."
            : status === "unsupported"
              ? "Non disponible sans clé VAPID ou sur ce navigateur."
              : "Une notif par alerte urgente du jour."
      }}
    </p>
    <div class="mt-3">
      <DsButton v-if="status === 'on'" variant="secondary" size="sm" :disabled="loading" @click="disable">
        Désactiver
      </DsButton>
      <DsButton v-else-if="status === 'off'" size="sm" :disabled="loading || !vapidKey" @click="enable">
        Activer
      </DsButton>
    </div>
  </DsCard>
</template>
