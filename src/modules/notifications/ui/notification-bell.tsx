"use client";

import { useMemo, useState } from "react";
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
import {
  Button,
  EmptyState,
  IconButton,
  Sheet,
  useAsyncAction,
} from "@/design-system";
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
import { resolveAiIntelDeepLink } from "@/modules/ai-intel/item-link";
import type { HubLocale } from "@/core/i18n";
import { formatRelativeTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

function notificationHref(n: HubNotification): string | null {
  const deep = resolveAiIntelDeepLink(n.metadata);
  if (deep) return deep;
  return n.href || null;
}

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
  if (category === "ai")
    return "bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]";
  if (category === "billing")
    return "bg-[var(--dh-warning-soft)] text-[var(--dh-warning)]";
  if (category === "account")
    return "bg-[var(--dh-info-soft)] text-[var(--dh-info)]";
  return "bg-muted text-muted-foreground";
}

export function NotificationBell({
  initialNotifications,
  locale = "fr",
}: {
  initialNotifications: HubNotification[];
  locale?: HubLocale;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [items, setItems] = useState(initialNotifications);
  const { run, pending } = useAsyncAction();

  const unread = useMemo(() => items.filter((n) => !n.read), [items]);
  const filtered = useMemo(
    () =>
      category === "all" ? items : items.filter((n) => n.category === category),
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
        const href = notificationHref(n);
        if (href) router.push(href);
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
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--dh-danger)] px-1 text-[length:var(--dh-text-2xs)] font-semibold leading-none text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </Button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Notifications"
        description={
          unread.length > 0
            ? `${unread.length} non lue${unread.length > 1 ? "s" : ""}`
            : "Tout est à jour"
        }
        headerActions={
          <>
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
            <IconButton label="Fermer" size="sm" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </IconButton>
          </>
        }
        subheader={
          <>
            <div className="border-b border-border px-4 pb-3">
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
                            "rounded-full px-1.5 text-[length:var(--dh-text-2xs)] tabular-nums",
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

            <PushEnableBanner className="mx-3 mb-2" />
          </>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            variant="inline"
            icon={Bell}
            title="Aucune notification"
            hint="Les alertes liées à l’AI, à la facturation et au compte apparaîtront ici."
          />
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
                        <span className="text-[length:var(--dh-text-2xs)] font-medium uppercase tracking-wide text-muted-foreground">
                          {NOTIFICATION_CATEGORY_LABELS[n.category]}
                        </span>
                      ) : null}
                      {!n.read ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--dh-brand)]" />
                      ) : null}
                      <span className="ml-auto text-[length:var(--dh-text-2xs)] text-muted-foreground">
                        {formatRelativeTime(n.created_at, locale)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-[length:var(--dh-text-sm)] font-medium leading-snug text-foreground">
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
      </Sheet>
    </>
  );
}
