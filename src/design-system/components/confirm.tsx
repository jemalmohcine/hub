"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/design-system/components/button";
import { Dialog } from "@/design-system/components/dialog";
import { Cluster, Stack } from "@/design-system/components/layout";
import { Text } from "@/design-system/components/typography";

export type ConfirmTone = "danger" | "default";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Runs after the user confirms. The dialog stays open with a spinner until it settles. */
  action?: () => Promise<void>;
};

type ConfirmApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<ConfirmApi | null>(null);

const DEFAULTS = {
  cancel: "Annuler",
  confirm: "Confirmer",
  delete: "Supprimer",
};

function actionErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "Une erreur est survenue";
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);
  const busyRef = useRef(false);

  const settle = useCallback((value: boolean) => {
    if (busyRef.current && !value) return;
    const current = pendingRef.current;
    pendingRef.current = null;
    busyRef.current = false;
    setBusy(false);
    setError(null);
    setPending(null);
    current?.resolve(value);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      pendingRef.current?.resolve(false);
      busyRef.current = false;
      setBusy(false);
      setError(null);
      const next = { ...options, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    const current = pendingRef.current;
    if (!current || busyRef.current) return;
    if (!current.action) {
      settle(true);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await current.action();
      settle(true);
    } catch (err) {
      busyRef.current = false;
      setBusy(false);
      setError(actionErrorMessage(err));
    }
  }, [settle]);

  const api = useMemo<ConfirmApi>(() => ({ confirm }), [confirm]);
  const tone = pending?.tone ?? "default";
  const confirmLabel =
    pending?.confirmLabel ??
    (tone === "danger" ? DEFAULTS.delete : DEFAULTS.confirm);

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <Dialog
        chrome="alert"
        open={pending != null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
        title={pending?.title ?? ""}
        description={pending?.description}
        size="sm"
        footer={
          <Stack gap={2} className="w-full">
            {error ? (
              <Text size="sm" tone="danger">
                {error}
              </Text>
            ) : null}
            <Cluster gap={2} className="w-full justify-end">
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => settle(false)}
              >
                {pending?.cancelLabel ?? DEFAULTS.cancel}
              </Button>
              <Button
                type="button"
                variant={tone === "danger" ? "danger" : "primary"}
                disabled={busy}
                aria-busy={busy}
                onClick={() => void handleConfirm()}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {confirmLabel}
              </Button>
            </Cluster>
          </Stack>
        }
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmApi["confirm"] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx.confirm;
}
