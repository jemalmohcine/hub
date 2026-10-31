"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastInput = {
  title: string;
  description?: string;
  durationMs?: number;
};

type ToastApi = {
  success: (input: string | ToastInput) => void;
  error: (input: string | ToastInput) => void;
  warning: (input: string | ToastInput) => void;
  info: (input: string | ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function normalizeInput(input: string | ToastInput): ToastInput {
  return typeof input === "string" ? { title: input } : input;
}

const TONE_STYLES: Record<
  ToastTone,
  { icon: typeof CheckCircle2; className: string }
> = {
  success: {
    icon: CheckCircle2,
    className:
      "border-success/30 bg-success/10 text-foreground [&_svg]:text-success",
  },
  error: {
    icon: XCircle,
    className:
      "border-destructive/30 bg-destructive/10 text-foreground [&_svg]:text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-warning/30 bg-warning/10 text-foreground [&_svg]:text-warning",
  },
  info: {
    icon: Info,
    className: "border-info/30 bg-info/10 text-foreground [&_svg]:text-info",
  },
};

function Toaster({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(var(--dh-safe-top)+0.75rem)] z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:top-auto sm:bottom-[calc(var(--dh-mobile-bottom-offset)+1rem)] sm:items-end lg:bottom-6"
    >
      {items.map((toast) => {
        const tone = TONE_STYLES[toast.tone];
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 fade-in sm:slide-in-from-right-2",
              tone.className,
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-xs leading-relaxed opacity-90">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => onDismiss(toast.id)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, input: string | ToastInput) => {
      const payload = normalizeInput(input);
      const id = crypto.randomUUID();
      setItems((prev) => [...prev, { id, tone, ...payload }]);
      window.setTimeout(
        () => dismiss(id),
        payload.durationMs ?? (tone === "error" ? 6000 : 4000),
      );
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (input) => push("success", input),
      error: (input) => push("error", input),
      warning: (input) => push("warning", input),
      info: (input) => push("info", input),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
