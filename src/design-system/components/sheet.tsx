"use client";

import { type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  DialogOverlay,
  DialogRoot,
  DialogTitle,
  DialogDescription,
} from "@/design-system/components/dialog";
import { cn } from "@/design-system/lib/cn";

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Actions rendered next to the title (close button is provided). */
  headerActions?: ReactNode;
  /** Sticky region under the header — filters, tabs, banners. */
  subheader?: ReactNode;
  /** `panel` docks top-right on desktop, `full` keeps the sheet centered wide. */
  desktop?: "panel" | "full";
  className?: string;
  children: ReactNode;
};

const DESKTOP_CLASS: Record<NonNullable<SheetProps["desktop"]>, string> = {
  panel:
    "lg:inset-auto lg:top-20 lg:right-6 lg:bottom-auto lg:max-h-[min(80dvh,36rem)] lg:w-[24rem] lg:rounded-2xl lg:border-b",
  full: "lg:inset-auto lg:top-1/2 lg:left-1/2 lg:max-h-[min(85dvh,44rem)] lg:w-[36rem] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border-b",
};

/**
 * Bottom sheet on mobile, floating panel on desktop.
 * Used by the notification centre and any future slide-up surface.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  headerActions,
  subheader,
  desktop = "panel",
  className,
  children,
}: SheetProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogOverlay className="backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          aria-describedby={description ? undefined : ""}
          className={cn(
            "fixed z-50 flex flex-col bg-card shadow-2xl outline-none",
            "duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in",
            "inset-x-0 bottom-0 max-h-[min(92dvh,40rem)] w-full rounded-t-[1.5rem] border border-b-0 border-border",
            "pb-[calc(var(--dh-safe-bottom)+0.75rem)]",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "lg:data-[state=closed]:fade-out-0 lg:data-[state=closed]:zoom-out-95 lg:data-[state=open]:fade-in-0 lg:data-[state=open]:zoom-in-95 lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=open]:slide-in-from-bottom-0",
            DESKTOP_CLASS[desktop],
            className,
          )}
        >
          <div className="flex justify-center pt-2.5 lg:hidden" aria-hidden>
            <div className="h-1 w-10 rounded-full bg-muted-foreground/35" />
          </div>

          <div className="flex items-start justify-between gap-3 px-4 pt-2 pb-3 lg:pt-4">
            <div className="min-w-0">
              <DialogTitle className="text-lg tracking-tight">
                {title}
              </DialogTitle>
              {description ? (
                <DialogDescription className="mt-0.5">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerActions}
            </div>
          </div>

          {subheader}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogRoot>
  );
}
