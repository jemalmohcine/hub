"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/design-system/components/button";
import { cn } from "@/lib/utils";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

/** Syncs DB preference → next-themes on mount / change. */
export function ThemeSync({ theme }: { theme?: "light" | "dark" | "system" | null }) {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    if (!theme) return;
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}

export function ThemeToggle({
  className,
  size = "icon",
}: {
  className?: string;
  size?: "icon" | "default";
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("size-9 px-0", className)}
        aria-label="Changer le thème"
        disabled
      >
        <Sun className="size-4 opacity-50" />
      </Button>
    );
  }

  const cycle = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const Icon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;
  const label =
    theme === "system"
      ? "Thème système"
      : resolvedTheme === "dark"
        ? "Thème sombre"
        : "Thème clair";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        size === "icon" ? "size-9 px-0" : "gap-2",
        className,
      )}
      onClick={cycle}
      aria-label={`${label} — cliquer pour changer`}
      title={label}
    >
      <Icon className="size-4" />
      {size === "default" ? <span className="text-sm">{label}</span> : null}
    </Button>
  );
}
