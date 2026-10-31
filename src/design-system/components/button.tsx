/**
 * Design system Button — wraps shadcn Button (best practice: single product API).
 */
import {
  Button as ShadcnButton,
  buttonVariants,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const variantMap: Record<
  ButtonVariant,
  NonNullable<VariantProps<typeof buttonVariants>["variant"]>
> = {
  primary: "default",
  secondary: "secondary",
  ghost: "ghost",
  danger: "destructive",
  outline: "outline",
};

const sizeMap: Record<
  ButtonSize,
  NonNullable<VariantProps<typeof buttonVariants>["size"]>
> = {
  sm: "sm",
  md: "default",
  lg: "lg",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  ...props
}: Omit<ComponentProps<typeof ShadcnButton>, "variant" | "size"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children?: ReactNode;
}) {
  return (
    <ShadcnButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={cn(
        "h-11 rounded-xl px-4",
        size === "sm" && "h-9",
        size === "lg" && "h-12 px-5",
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}

const iconSizeMap: Record<ButtonSize, string> = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

/**
 * Square, icon-only button. `label` is mandatory so these never ship
 * without an accessible name — modules used to hand-roll raw `<button>`s.
 */
export function IconButton({
  label,
  className,
  variant = "ghost",
  size = "md",
  children,
  ...props
}: Omit<ComponentProps<typeof ShadcnButton>, "variant" | "size"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}) {
  return (
    <ShadcnButton
      aria-label={label}
      title={label}
      variant={variantMap[variant]}
      size="icon"
      className={cn("shrink-0 rounded-xl p-0", iconSizeMap[size], className)}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}

export { buttonVariants };
