"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Input as UiInput } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Textarea as UiTextarea } from "@/components/ui/textarea";
import { Checkbox as UiCheckbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <UiLabel htmlFor={htmlFor} className={cn("mb-2", className)}>
      {children}
    </UiLabel>
  );
}

type InvalidProps = {
  invalid?: boolean;
};

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & InvalidProps) {
  return (
    <UiInput
      aria-invalid={invalid || undefined}
      className={cn("h-11 rounded-xl px-3.5", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & InvalidProps) {
  return (
    <UiTextarea
      aria-invalid={invalid || undefined}
      className={cn("min-h-24 rounded-xl", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & InvalidProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30",
        invalid &&
          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  className,
  label,
  id,
  name,
  defaultChecked,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  const checkboxId = id ?? name;
  return (
    <label
      htmlFor={checkboxId}
      className="flex cursor-pointer items-center gap-3 text-sm"
    >
      <UiCheckbox
        id={checkboxId}
        name={name}
        defaultChecked={defaultChecked}
        className={className}
        {...(props as Record<string, unknown>)}
      />
      {label}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const enhanced = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    return cloneElement(
      child as ReactElement<Record<string, unknown>>,
      {
        invalid: Boolean(error),
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      },
    );
  });

  return (
    <div className="w-full" data-invalid={error ? "true" : undefined}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {enhanced}
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Form shell — disables native browser validation bubbles. */
export function Form({
  className,
  children,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form noValidate className={className} {...props}>
      {children}
    </form>
  );
}
