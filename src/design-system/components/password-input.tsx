"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PasswordInputProps = Omit<
  React.ComponentProps<"input">,
  "type"
> & {
  defaultVisible?: boolean;
  invalid?: boolean;
};

export function PasswordInput({
  className,
  defaultVisible = false,
  id,
  disabled,
  invalid,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(defaultVisible);
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  return (
    <div className="relative w-full">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        disabled={disabled}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-invalid={isInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        className={cn("h-11 rounded-xl px-3.5 pr-11", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={0}
        disabled={disabled}
        aria-label={
          visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
        }
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((v) => !v)}
        className={cn(
          "absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
