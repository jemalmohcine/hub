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
import { Button } from "@/design-system/components/button";
import { Dialog } from "@/design-system/components/dialog";
import { Cluster } from "@/design-system/components/layout";

export type ConfirmTone = "danger" | "default";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
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

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const settle = useCallback((value: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    current?.resolve(value);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      pendingRef.current?.resolve(false);
      const next = { ...options, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const api = useMemo<ConfirmApi>(() => ({ confirm }), [confirm]);
  const tone = pending?.tone ?? "default";

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <Dialog
        open={pending != null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
        title={pending?.title ?? ""}
        description={pending?.description}
        size="sm"
        footer={
          <Cluster gap={2} className="w-full justify-end">
            <Button type="button" variant="ghost" onClick={() => settle(false)}>
              {pending?.cancelLabel ?? DEFAULTS.cancel}
            </Button>
            <Button
              type="button"
              variant={tone === "danger" ? "danger" : "primary"}
              onClick={() => settle(true)}
            >
              {pending?.confirmLabel ??
                (tone === "danger" ? DEFAULTS.delete : DEFAULTS.confirm)}
            </Button>
          </Cluster>
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
