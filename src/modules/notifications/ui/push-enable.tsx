"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Button, Text, useAsyncAction } from "@/design-system";
import {
  removePushSubscription,
  savePushSubscription,
} from "@/modules/notifications/push-actions";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios =
    "standalone" in navigator &&
    Boolean((navigator as { standalone?: boolean }).standalone);
  return mq || ios;
}

type Status = "unsupported" | "denied" | "off" | "on" | "loading";

async function ensureSubscription(vapidKey: string) {
  const reg =
    (await navigator.serviceWorker.getRegistration()) ||
    (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: permission as "denied" | "default" };

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Subscription invalide");
  }
  await savePushSubscription({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    userAgent: navigator.userAgent,
  });
  return { status: "granted" as const };
}

function usePushStatus() {
  const [status, setStatus] = useState<Status>("loading");
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    async function sync() {
      if (
        !vapidKey ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setStatus("on");
          const json = sub.toJSON();
          if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
            await savePushSubscription({
              endpoint: json.endpoint,
              keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
              userAgent: navigator.userAgent,
            }).catch(() => null);
          }
          return;
        }
      } catch {
        // ignore
      }
      setStatus("off");
    }
    void sync();
  }, [vapidKey]);

  return { status, setStatus, vapidKey };
}

/** Full card for Settings — same hub notifs, on the phone. */
export function PushEnableCard() {
  const { status, setStatus, vapidKey } = usePushStatus();
  const { run, pending } = useAsyncAction();

  function enable() {
    void run(
      async () => {
        if (!vapidKey) throw new Error("Clé VAPID manquante");
        const result = await ensureSubscription(vapidKey);
        if (result.status === "granted") setStatus("on");
        else setStatus(result.status === "denied" ? "denied" : "off");
        if (result.status === "denied") {
          throw new Error("Permission refusée par le navigateur");
        }
      },
      {
        success: "Notifications téléphone activées",
        error: (err) =>
          err instanceof Error ? err.message : "Activation impossible",
      },
    );
  }

  function disable() {
    void run(
      async () => {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await removePushSubscription(sub.endpoint).catch(() => null);
          await sub.unsubscribe();
        }
        setStatus("off");
      },
      {
        success: "Notifications téléphone désactivées",
        error: "Impossible de désactiver les notifications",
      },
    );
  }

  if (status === "loading") return null;
  if (status === "unsupported") {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
        <Text size="sm" tone="muted">
          {!vapidKey
            ? "Clés VAPID manquantes sur le serveur (NEXT_PUBLIC_VAPID_PUBLIC_KEY). Les alertes téléphone ne peuvent pas être activées."
            : "Ce navigateur ne peut pas afficher les notifications système."}
        </Text>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]">
          {status === "on" ? (
            <BellRing className="h-4 w-4" />
          ) : status === "denied" ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <Text weight="medium" size="sm">
            Sur mon téléphone
          </Text>
          <Text size="sm" tone="muted" className="mt-1">
            {status === "on"
              ? "OK. Tu recevras une alerte uniquement pour l’urgent (prix, modèle, repo qui explose). Plan Pro requis."
              : status === "denied"
                ? "Permission refusée. Réactive-la dans Réglages → Notifications de ton téléphone."
                : "Alertes urgentes seulement : prix, nouveau modèle, repo GitHub qui explose. Plan Pro requis."}
          </Text>
          {!isStandalonePwa() && status === "off" ? (
            <Text size="sm" tone="muted" className="mt-1">
              iPhone : Safari → Partager → Sur l’écran d’accueil, puis active ici.
            </Text>
          ) : null}
          <div className="mt-3">
            {status === "on" ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={disable}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Désactivation…
                  </>
                ) : (
                  "Désactiver"
                )}
              </Button>
            ) : status === "denied" ? null : (
              <Button type="button" size="sm" disabled={pending} onClick={enable}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activation…
                  </>
                ) : (
                  "Recevoir les notifs sur le téléphone"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact banner — notifications panel and overview. Renders nothing once enabled. */
export function PushEnableBanner({ className }: { className?: string }) {
  const { status, setStatus, vapidKey } = usePushStatus();
  const { run, pending } = useAsyncAction();

  if (status === "loading" || status === "unsupported" || status === "on" || status === "denied") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-[var(--dh-brand)]/20 bg-[var(--dh-brand-soft)]/30 px-3 py-2.5",
        className,
      )}
    >
      <BellRing className="h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
      <Text size="sm" className="min-w-0 flex-1 leading-snug">
        Recevoir ces notifs aussi sur ton téléphone
      </Text>
      <Button
        type="button"
        size="sm"
        disabled={pending || !vapidKey}
        onClick={() => {
          void run(
            async () => {
              if (!vapidKey) throw new Error("Clé VAPID manquante");
              const result = await ensureSubscription(vapidKey);
              if (result.status === "granted") setStatus("on");
              else setStatus(result.status === "denied" ? "denied" : "off");
              if (result.status !== "granted") {
                throw new Error("Activation refusée");
              }
            },
            {
              success: "Notifications activées",
              error: "Impossible d'activer les notifications",
            },
          );
        }}
        className="h-8 shrink-0 px-2.5 text-xs"
      >
        {pending ? "…" : "Activer"}
      </Button>
    </div>
  );
}
