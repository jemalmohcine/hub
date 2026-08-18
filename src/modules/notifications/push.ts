import webpush from "web-push";
import { createAdminClient } from "@/core/auth/supabase/admin";

export type PushPayload = {
  title: string;
  body?: string;
  href?: string | null;
  tag?: string | null;
  severity?: string;
};

/** Phone pushes are interruptive — only urgency that demands action today. */
export function isUrgentPush(payload: Pick<PushPayload, "severity">): boolean {
  return payload.severity === "urgent";
}

type PushRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "mailto:noreply@devhub.app";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function deleteSubscription(endpoint: string) {
  const admin = createAdminClient();
  await admin.from("hub_push_subscriptions").delete().eq("endpoint", endpoint);
}

function uniqueEndpoints(rows: PushRow[]): PushRow[] {
  const seen = new Set<string>();
  const unique: PushRow[] = [];
  for (const row of rows) {
    if (seen.has(row.endpoint)) continue;
    seen.add(row.endpoint);
    unique.push(row);
  }
  return unique;
}

async function sendToRow(row: PushRow, payload: PushPayload) {
  try {
    await webpush.sendNotification(
      {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body ?? "",
        href: payload.href ?? "/app/ai",
        tag: payload.tag ?? undefined,
        severity: payload.severity ?? "info",
      }),
      { TTL: 60 * 60 * 12, urgency: payload.severity === "urgent" ? "high" : "normal" },
    );
    return true;
  } catch (err) {
    const status =
      err && typeof err === "object" && "statusCode" in err
        ? Number((err as { statusCode?: number }).statusCode)
        : 0;
    // Gone / expired subscription
    if (status === 404 || status === 410) {
      await deleteSubscription(row.endpoint);
    }
    return false;
  }
}

/** Push to one user (all their devices). Non-urgent payloads are never sent. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!isUrgentPush(payload)) return { sent: 0, skipped: true as const };
  if (!configureWebPush()) return { sent: 0, skipped: true as const };

  const admin = createAdminClient();
  const { data } = await admin
    .from("hub_push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  const rows = uniqueEndpoints((data ?? []) as PushRow[]);
  let sent = 0;
  for (const row of rows) {
    if (await sendToRow(row, payload)) sent += 1;
  }
  return { sent, skipped: false as const };
}

/**
 * Broadcast to subscribed devices.
 * For AI category: Pro users with module:ai only.
 * Never sends unless severity is urgent.
 */
export async function sendPushBroadcast(
  payload: PushPayload,
  opts: { category?: string } = {},
) {
  if (!isUrgentPush(payload)) {
    return {
      sent: 0,
      skipped: true as const,
      reason: "not_urgent" as const,
      eligible: 0,
    };
  }
  if (!configureWebPush()) {
    return {
      sent: 0,
      skipped: true as const,
      reason: "missing_vapid" as const,
      eligible: 0,
    };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("hub_push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");

  let rows = uniqueEndpoints((data ?? []) as PushRow[]);

  if (opts.category === "ai" && rows.length > 0) {
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: subs } = await admin
      .from("subscriptions")
      .select("user_id, plan, status")
      .in("user_id", userIds)
      .eq("status", "active")
      .eq("plan", "pro");
    const proIds = new Set((subs ?? []).map((s) => s.user_id as string));
    rows = rows.filter((r) => proIds.has(r.user_id));
  }

  const eligible = rows.length;
  let sent = 0;
  for (const row of rows) {
    if (await sendToRow(row, payload)) sent += 1;
  }
  return {
    sent,
    skipped: false as const,
    reason: eligible === 0 ? ("no_subscribers" as const) : null,
    eligible,
  };
}
