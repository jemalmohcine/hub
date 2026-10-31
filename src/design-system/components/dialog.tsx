"use client";

import { type ComponentProps, type ReactNode } from "react";
import {
  Dialog as ShadcnDialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/design-system/lib/cn";

export type DialogSize = "sm" | "md" | "lg";
export type DialogChrome = "form" | "alert";

const sizeClass: Record<DialogSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Rendered above the title — badges, chips, breadcrumbs. */
  headerAbove?: ReactNode;
  /** Pass `srOnlyDescription` when it only exists for screen readers. */
  description?: ReactNode;
  srOnlyDescription?: boolean;
  size?: DialogSize;
  /**
   * `form` is the default sheet-like chrome (header/footer rules).
   * `alert` is a compact confirm: title, copy and actions with no empty gap.
   */
  chrome?: DialogChrome;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/**
 * The single modal surface for the app. Full-height sheet on mobile,
 * centered dialog from `sm` up, so modules never re-implement a sheet.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  headerAbove,
  description,
  srOnlyDescription,
  size = "md",
  chrome = "form",
  footer,
  className,
  children,
}: DialogProps) {
  const compact = chrome === "alert";

  return (
    <ShadcnDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-hidden p-0",
          compact ? "gap-0" : "gap-4",
          children != null
            ? "grid-rows-[auto_minmax(0,1fr)_auto]"
            : "grid-rows-[auto_auto]",
          sizeClass[size],
          className,
        )}
      >
        <DialogHeader
          className={cn(
            "px-5",
            compact ? "pt-5 pb-2" : "border-b border-border py-4",
          )}
        >
          {headerAbove}
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription className={cn(srOnlyDescription && "sr-only")}>
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {children != null ? (
          <div className="overflow-y-auto overscroll-contain px-5 py-4">
            {children}
          </div>
        ) : null}

        {footer ? (
          <DialogFooter
            className={cn(
              "px-5 pb-[calc(var(--dh-safe-bottom)+0.75rem)] sm:pb-3",
              compact ? "pt-2" : "border-t border-border py-3",
            )}
          >
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </ShadcnDialog>
  );
}

export type DialogRootProps = ComponentProps<typeof ShadcnDialog>;

/** Escape hatch for fully custom modal layouts (rare). */
export {
  ShadcnDialog as DialogRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
};
