import type { CvThemeId } from "@/modules/cv-builder/types";

export type CvTheme = {
  id: CvThemeId;
  label: string;
  description: string;
  layout: "single" | "sidebar";
  fonts: {
    heading: string;
    body: string;
    mono: string;
    google: string;
  };
  colors: {
    bg: string;
    surface: string;
    sidebar: string;
    sidebarText: string;
    text: string;
    muted: string;
    accent: string;
    accentSoft: string;
    border: string;
    chip: string;
    chipText: string;
  };
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
    description: "Épuré, ATS friendly, très lisible",
    layout: "single",
    fonts: {
      heading: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, monospace",
      google:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap",
    },
    colors: {
      bg: "#ffffff",
      surface: "#ffffff",
      sidebar: "#f8fafc",
      sidebarText: "#0f172a",
      text: "#0f172a",
      muted: "#64748b",
      accent: "#0f172a",
      accentSoft: "#f1f5f9",
      border: "#e2e8f0",
      chip: "#f1f5f9",
      chipText: "#334155",
    },
    preview: {
      bg: "#ffffff",
      accent: "#0f172a",
      text: "#0f172a",
      muted: "#64748b",
      font: "Inter, sans-serif",
    },
  },
  {
    id: "modern",
    label: "Moderne",
    description: "Sidebar indigo, hiérarchie claire",
    layout: "sidebar",
    fonts: {
      heading: "'Plus Jakarta Sans', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, monospace",
      google:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&family=JetBrains+Mono:wght@500&display=swap",
    },
    colors: {
      bg: "#ffffff",
      surface: "#ffffff",
      sidebar: "#312e81",
      sidebarText: "#eef2ff",
      text: "#0f172a",
      muted: "#64748b",
      accent: "#4f46e5",
      accentSoft: "#eef2ff",
      border: "#e2e8f0",
      chip: "#eef2ff",
      chipText: "#3730a3",
    },
    preview: {
      bg: "#ffffff",
      accent: "#4f46e5",
      text: "#0f172a",
      muted: "#64748b",
      font: "Plus Jakarta Sans, sans-serif",
    },
  },
  {
    id: "classic",
    label: "Classique",
    description: "Serif élégant, format traditionnel",
    layout: "single",
    fonts: {
      heading: "'Libre Baskerville', Georgia, serif",
      body: "'Source Sans 3', system-ui, sans-serif",
      mono: "'Source Sans 3', sans-serif",
      google:
        "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap",
    },
    colors: {
      bg: "#fffdf8",
      surface: "#fffdf8",
      sidebar: "#f5efe6",
      sidebarText: "#1c1917",
      text: "#1c1917",
      muted: "#78716c",
      accent: "#1e3a5f",
      accentSoft: "#f5efe6",
      border: "#e7e5e4",
      chip: "#f5efe6",
      chipText: "#1e3a5f",
    },
    preview: {
      bg: "#fffdf8",
      accent: "#1e3a5f",
      text: "#1c1917",
      muted: "#78716c",
      font: "Libre Baskerville, serif",
    },
  },
  {
    id: "tech",
    label: "Tech",
    description: "Dark mode, accents cyan, style ingénieur",
    layout: "sidebar",
    fonts: {
      heading: "'JetBrains Mono', ui-monospace, monospace",
      body: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, monospace",
      google:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap",
    },
    colors: {
      bg: "#0b1220",
      surface: "#111827",
      sidebar: "#020617",
      sidebarText: "#e2e8f0",
      text: "#f8fafc",
      muted: "#94a3b8",
      accent: "#22d3ee",
      accentSoft: "#083344",
      border: "#1e293b",
      chip: "#0f172a",
      chipText: "#67e8f9",
    },
    preview: {
      bg: "#0b1220",
      accent: "#22d3ee",
      text: "#f8fafc",
      muted: "#94a3b8",
      font: "JetBrains Mono, monospace",
    },
  },
];

export function getTheme(id: CvThemeId): CvTheme {
  return CV_THEMES.find((t) => t.id === id) ?? CV_THEMES[1];
}
