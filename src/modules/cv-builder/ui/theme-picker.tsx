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
    <div className="grid grid-cols-2 gap-2">
      {CV_THEMES.map((theme) => {
        const active = value === theme.id;
        const c = theme.colors;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={cn(
              "overflow-hidden rounded-2xl border text-left transition-colors",
              active
                ? "border-[var(--dh-brand)] ring-2 ring-[var(--dh-brand)]/20"
                : "border-border hover:bg-muted/30",
            )}
          >
            <div
              className="flex h-16"
              style={{ background: c.bg }}
            >
              {theme.layout === "sidebar" ? (
                <>
                  <div
                    className="w-1/3 p-2"
                    style={{ background: c.sidebar }}
                  >
                    <div
                      className="mb-1.5 h-2 w-3/4 rounded-sm"
                      style={{ background: c.accent }}
                    />
                    <div
                      className="mb-1 h-1 w-full rounded-sm opacity-50"
                      style={{ background: c.sidebarText }}
                    />
                    <div
                      className="h-1 w-2/3 rounded-sm opacity-30"
                      style={{ background: c.sidebarText }}
                    />
                  </div>
                  <div className="flex-1 p-2">
                    <div
                      className="mb-1 h-1.5 w-1/2 rounded-sm"
                      style={{ background: c.accent }}
                    />
                    <div
                      className="mb-1 h-1 w-full rounded-sm opacity-25"
                      style={{ background: c.text }}
                    />
                    <div
                      className="h-1 w-4/5 rounded-sm opacity-20"
                      style={{ background: c.text }}
                    />
                  </div>
                </>
              ) : (
                <div className="w-full p-2">
                  <div
                    className="mb-2 h-2 w-1/2 rounded-sm"
                    style={{ background: c.accent }}
                  />
                  <div
                    className="mb-1 h-1 w-full rounded-sm opacity-25"
                    style={{ background: c.text }}
                  />
                  <div
                    className="h-1 w-3/4 rounded-sm opacity-20"
                    style={{ background: c.text }}
                  />
                </div>
              )}
            </div>
            <div className="border-t border-border/60 bg-card/80 px-3 py-2.5">
              <div className="text-sm font-medium">{theme.label}</div>
              <div className="mt-0.5 text-[length:var(--dh-text-2xs)] leading-snug text-muted-foreground">
                {theme.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
