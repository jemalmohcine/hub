import type { CvThemeId } from "@/modules/cv-builder/types";

export type CvTheme = {
  id: CvThemeId;
  label: string;
  description: string;
  preview: {
    bg: string;
    accent: string;
    text: string;
    muted: string;
    font: string;
  };
};

export const CV_THEMES: CvTheme[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Épuré, lisible, sans fioritures",
    preview: {
      bg: "#ffffff",
      accent: "#111827",
      text: "#111827",
      muted: "#6b7280",
      font: "system-ui, sans-serif",
    },
  },
  {
    id: "modern",
    label: "Moderne",
    description: "Sidebar colorée, look contemporain",
    preview: {
      bg: "#ffffff",
      accent: "#0d9488",
      text: "#0f172a",
      muted: "#64748b",
      font: "system-ui, sans-serif",
    },
  },
  {
    id: "classic",
    label: "Classique",
    description: "Serif, structure traditionnelle",
    preview: {
      bg: "#fffdf8",
      accent: "#1e3a5f",
      text: "#1a1a1a",
      muted: "#5c5c5c",
      font: "Georgia, serif",
    },
  },
  {
    id: "tech",
    label: "Tech",
    description: "Monospace, barre sombre, style dev",
    preview: {
      bg: "#0f172a",
      accent: "#22d3ee",
      text: "#f8fafc",
      muted: "#94a3b8",
      font: "ui-monospace, monospace",
    },
  },
];

export function getTheme(id: CvThemeId): CvTheme {
  return CV_THEMES.find((t) => t.id === id) ?? CV_THEMES[1];
}
