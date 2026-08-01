"use client";

import { CV_THEMES } from "@/modules/cv-builder/themes";
import type { CvThemeId } from "@/modules/cv-builder/types";
import { cn } from "@/lib/utils";

export function ThemePicker({
  value,
  onChange,
}: {
  value: CvThemeId;
  onChange: (theme: CvThemeId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CV_THEMES.map((theme) => {
        const active = value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={cn(
              "rounded-2xl border p-3 text-left transition-colors",
              active
                ? "border-[var(--dh-brand)] ring-2 ring-[var(--dh-brand)]/20"
                : "border-border hover:bg-muted/40",
            )}
          >
            <div
              className="mb-2 h-14 rounded-xl border border-border/60 p-2"
              style={{ background: theme.preview.bg }}
            >
              <div
                className="h-2 w-8 rounded"
                style={{ background: theme.preview.accent }}
              />
              <div
                className="mt-2 h-1.5 w-full rounded opacity-40"
                style={{ background: theme.preview.muted }}
              />
              <div
                className="mt-1 h-1.5 w-3/4 rounded opacity-30"
                style={{ background: theme.preview.muted }}
              />
            </div>
            <div className="text-sm font-medium">{theme.label}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {theme.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
