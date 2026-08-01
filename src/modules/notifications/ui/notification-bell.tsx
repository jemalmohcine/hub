"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  CreditCard,
  Sparkles,
  UserRound,
  Shield,
  X,
} from "lucide-react";
import { Button, Text, useAsyncAction } from "@/design-system";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications/actions";
import { PushEnableBanner } from "@/modules/notifications/ui/push-enable";
import {
  NOTIFICATION_CATEGORY_LABELS,
  type HubNotification,
  type NotificationCategory,
} from "@/modules/notifications/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const CATEGORIES: Array<NotificationCategory | "all"> = [
  "all",
  "ai",
  "billing",
  "account",
  "system",
];

function CategoryIcon({
  category,
  className,
}: {
  category: NotificationCategory;
  className?: string;
}) {
  const cls = cn("h-4 w-4", className);
  if (category === "ai") return <Sparkles className={cls} />;
  if (category === "billing") return <CreditCard className={cls} />;
  if (category === "account") return <UserRound className={cls} />;
  return <Shield className={cls} />;
}

function categoryAccent(category: NotificationCategory) {
  if (category === "ai") return "bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]";
  if (category === "billing") return "bg-[var(--dh-warning-soft)] text-[var(--dh-warning)]";
  if (category === "account") return "bg-[var(--dh-info-soft)] text-[var(--dh-info)]";
  return "bg-muted text-muted-foreground";
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "À l’instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
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
  const { run, pending } = useAsyncAction();

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
    void run(
      async () => {
        if (!n.read) {
          await markNotificationRead(n.id);
          setItems((prev) =>
            prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
          );
        }
        setOpen(false);
        if (n.href) router.push(n.href);
      },
      { silent: true },
    );
  }

  function markAll() {
    const ids = unread.map((n) => n.id);
    if (ids.length === 0) return;
    void run(
      async () => {
        await markAllNotificationsRead(ids);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      },
      {
        success: "Toutes les notifications sont lues",
        error: "Impossible de marquer les notifications",
      },
    );
  }

  return (
    <>
      <Button
        type="button"
        variant={unread.length > 0 ? "secondary" : "ghost"}
        size="sm"
        aria-label={
          unread.length > 0
            ? `${unread.length} notifications non lues`
            : "Notifications"
        }
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="relative h-10 w-10 shrink-0 rounded-xl p-0"
      >
        <Bell
          className={cn(
            "h-5 w-5",
            unread.length > 0 && "text-[var(--dh-brand)]",
          )}
        />
        {unread.length > 0 ? (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--dh-danger)] px-1 text-[10px] font-semibold leading-none text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/55 backdrop-blur-[2px]" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              "fixed z-50 flex flex-col bg-card shadow-2xl outline-none",
              "duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in",
              // Mobile-first: bottom sheet
              "inset-x-0 bottom-0 max-h-[min(92dvh,40rem)] w-full rounded-t-[1.5rem] border border-border border-b-0",
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
              "pb-[calc(var(--dh-safe-bottom)+0.75rem)]",
              // Desktop: floating panel
              "lg:inset-auto lg:top-20 lg:right-6 lg:bottom-auto lg:max-h-[min(80dvh,36rem)] lg:w-[24rem] lg:rounded-2xl lg:border-b",
              "lg:data-[state=closed]:fade-out-0 lg:data-[state=closed]:zoom-out-95 lg:data-[state=open]:fade-in-0 lg:data-[state=open]:zoom-in-95 lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=open]:slide-in-from-bottom-0",
            )}
          >
            <div className="flex justify-center pt-2.5 lg:hidden">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/35" />
            </div>

            <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-2 lg:pt-4">
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Notifications
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
                  {unread.length > 0
                    ? `${unread.length} non lue${unread.length > 1 ? "s" : ""}`
                    : "Tout est à jour"}
                </DialogDescription>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {unread.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={markAll}
                    className="h-9 gap-1.5 px-2.5 text-xs"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Tout marquer comme lu
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Fermer"
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-xl p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="-mx-0 border-b border-border px-4 pb-3">
              <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CATEGORIES.map((c) => {
                  const active = category === c;
                  const count = counts[c] ?? 0;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-foreground text-background"
                          : "bg-muted/80 text-muted-foreground active:bg-muted",
                      )}
                    >
                      {c !== "all" ? (
                        <CategoryIcon category={c} className="h-3.5 w-3.5" />
                      ) : null}
                      {c === "all" ? "Tous" : NOTIFICATION_CATEGORY_LABELS[c]}
                      {count > 0 ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 text-[11px] tabular-nums",
                            active
                              ? "bg-background/20 text-background"
                              : "bg-background/60 text-foreground",
                          )}
                        >
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <PushEnableBanner />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Text size="sm" weight="medium">
                    Aucune notification
                  </Text>
                  <Text size="sm" tone="muted">
                    Les alertes liées à l’AI, à la facturation et au compte
                    apparaîtront ici.
                  </Text>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openAndMark(n)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors active:scale-[0.99]",
                          n.read
                            ? "border-transparent bg-muted/35"
                            : "border-[var(--dh-brand)]/25 bg-[var(--dh-brand-soft)]/25",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            categoryAccent(n.category),
                          )}
                        >
                          <CategoryIcon category={n.category} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="mb-1 flex items-center gap-2">
                            {n.category !== "ai" ? (
                              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {NOTIFICATION_CATEGORY_LABELS[n.category]}
                              </span>
                            ) : null}
                            {!n.read ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--dh-brand)]" />
                            ) : null}
                            <span className="ml-auto text-[11px] text-muted-foreground">
                              {relativeTime(n.created_at)}
                            </span>
                          </span>
                          <span className="line-clamp-2 text-[15px] font-medium leading-snug text-foreground">
                            {n.title}
                          </span>
                          {n.body ? (
                            <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              {n.body}
                            </span>
                          ) : null}
                        </span>
                        <ChevronRight className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
