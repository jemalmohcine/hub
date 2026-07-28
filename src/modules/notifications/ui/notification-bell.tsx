"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Bell,
  CheckCheck,
  CreditCard,
  Sparkles,
  UserRound,
  Shield,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  Heading,
  Stack,
  Text,
} from "@/design-system";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications/actions";
import {
  NOTIFICATION_CATEGORY_LABELS,
  type HubNotification,
  type NotificationCategory,
} from "@/modules/notifications/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES: Array<NotificationCategory | "all"> = [
  "all",
  "ai",
  "billing",
  "account",
  "system",
];

function severityTone(
  severity: HubNotification["severity"],
): "danger" | "warning" | "success" | "info" | "neutral" {
  if (severity === "urgent") return "danger";
  if (severity === "warning") return "warning";
  if (severity === "success") return "success";
  if (severity === "info") return "info";
  return "neutral";
}

function CategoryIcon({ category }: { category: NotificationCategory }) {
  if (category === "ai") return <Sparkles className="h-3.5 w-3.5" />;
  if (category === "billing") return <CreditCard className="h-3.5 w-3.5" />;
  if (category === "account") return <UserRound className="h-3.5 w-3.5" />;
  return <Shield className="h-3.5 w-3.5" />;
}

export function NotificationBell({
  initialNotifications,
}: {
  initialNotifications: HubNotification[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [items, setItems] = useState(initialNotifications);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initialNotifications);
  }, [initialNotifications]);

  const unread = useMemo(() => items.filter((n) => !n.read), [items]);
  const filtered = useMemo(
    () =>
      category === "all"
        ? items
        : items.filter((n) => n.category === category),
    [items, category],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: unread.length };
    for (const n of unread) {
      map[n.category] = (map[n.category] ?? 0) + 1;
    }
    return map;
  }, [unread]);

  function openAndMark(n: HubNotification) {
    startTransition(async () => {
      if (!n.read) {
        await markNotificationRead(n.id);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
        );
      }
      setOpen(false);
      if (n.href) router.push(n.href);
    });
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant={unread.length > 0 ? "secondary" : "ghost"}
        size="sm"
        aria-label={`${unread.length} notifications`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell
          className={cn(
            "h-4 w-4",
            unread.length > 0 && "text-[var(--dh-brand)]",
          )}
        />
        {unread.length > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--dh-danger)] px-1 text-[10px] font-semibold text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fermer"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <Card
            className="absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,26rem)] overflow-hidden border-[var(--dh-brand)]/15 shadow-2xl"
            padding="none"
          >
            <div className="border-b border-border bg-gradient-to-br from-[var(--dh-brand-soft)]/50 to-transparent px-3 py-3">
              <Cluster gap={2} className="w-full justify-between">
                <div>
                  <Heading level={4}>Notifications</Heading>
                  <Text size="sm" tone="muted">
                    AI · billing · compte · système
                  </Text>
                </div>
                {unread.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      const ids = unread.map((n) => n.id);
                      startTransition(async () => {
                        await markAllNotificationsRead(ids);
                        setItems((prev) =>
                          prev.map((n) => ({ ...n, read: true })),
                        );
                      });
                    }}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Tout lu
                  </Button>
                ) : null}
              </Cluster>
            </div>

            <Stack gap={3} className="p-3">
              <Cluster gap={1} className="flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      category === c
                        ? "bg-[var(--dh-brand)] text-[var(--dh-brand-foreground)]"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c !== "all" ? <CategoryIcon category={c} /> : null}
                    {c === "all" ? "Tous" : NOTIFICATION_CATEGORY_LABELS[c]}
                    {counts[c] ? ` · ${counts[c]}` : ""}
                  </button>
                ))}
              </Cluster>

              <Stack gap={2} className="max-h-[22rem] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center">
                    <Text size="sm" tone="muted">
                      Aucune notification ici
                    </Text>
                  </div>
                ) : (
                  filtered.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openAndMark(n)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left transition-colors",
                        n.read
                          ? "border-border bg-background hover:bg-muted/40"
                          : "border-[var(--dh-brand)]/35 bg-[var(--dh-brand-soft)]/35 hover:bg-[var(--dh-brand-soft)]/55",
                      )}
                    >
                      <Cluster gap={2} className="mb-1 flex-wrap">
                        <Badge tone="neutral">
                          <span className="inline-flex items-center gap-1">
                            <CategoryIcon category={n.category} />
                            {NOTIFICATION_CATEGORY_LABELS[n.category]}
                          </span>
                        </Badge>
                        <Badge tone={severityTone(n.severity)}>
                          {n.severity}
                        </Badge>
                        {!n.read ? <Badge tone="brand">Nouveau</Badge> : null}
                      </Cluster>
                      <Text size="sm" weight="medium" className="line-clamp-2">
                        {n.title}
                      </Text>
                      {n.body ? (
                        <Text
                          size="sm"
                          tone="muted"
                          className="mt-1 line-clamp-2"
                        >
                          {n.body}
                        </Text>
                      ) : null}
                      <Text size="sm" tone="muted" className="mt-1.5">
                        {new Date(n.created_at).toLocaleString("fr-FR")}
                      </Text>
                    </button>
                  ))
                )}
              </Stack>

              <Text size="sm" tone="muted" className="text-center">
                <Link
                  href="/app/ai"
                  className="text-[var(--dh-brand)] hover:underline"
                  onClick={() => setOpen(false)}
                >
                  AI
                </Link>
                {" · "}
                <Link
                  href="/app/settings/billing"
                  className="text-[var(--dh-brand)] hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Billing
                </Link>
                {" · "}
                <Link
                  href="/app/settings/account"
                  className="text-[var(--dh-brand)] hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Compte
                </Link>
              </Text>
            </Stack>
          </Card>
        </>
      ) : null}
    </div>
  );
}
