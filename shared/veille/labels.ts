import type { VeilleCategory, VeilleProvider, VeilleSeverity } from "./types";

export const VEILLE_CATEGORY_LABELS: Record<VeilleCategory, string> = {
  securite: "Sécurité",
  versions: "Versions",
  "modeles-prix": "Modèles et prix",
  "outils-agents": "Outils de développement",
  "repos-github": "Repos GitHub",
};

export const VEILLE_PROVIDER_LABELS: Record<VeilleProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  "google-gemini": "Gemini",
  "xai-grok": "Grok / xAI",
  vercel: "Vercel",
  cursor: "Cursor",
  github: "GitHub",
  "nuxt-vue": "Vue / Nuxt",
  "laravel-php": "Laravel / PHP",
  "node-npm": "Node / npm",
  other: "Autre",
};

export const VEILLE_SEVERITY_LABELS: Record<VeilleSeverity, string> = {
  critique: "Critique",
  elevee: "Élevée",
  moyenne: "Moyenne",
  info: "Info",
};

export const VEILLE_FILTER_CHIPS: { id: "all" | VeilleCategory; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "securite", label: "Sécurité" },
  { id: "versions", label: "Versions" },
  { id: "modeles-prix", label: "Modèles et prix" },
  { id: "outils-agents", label: "Outils de développement" },
  { id: "repos-github", label: "Repos GitHub" },
];
