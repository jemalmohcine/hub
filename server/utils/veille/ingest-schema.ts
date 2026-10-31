import { z } from "zod";
import type { VeilleIngestItem } from "../../shared/veille/types";

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const categorySchema = z.enum([
  "securite",
  "versions",
  "modeles-prix",
  "outils-agents",
  "repos-github",
]);

const providerSchema = z.enum([
  "anthropic",
  "openai",
  "google-gemini",
  "xai-grok",
  "vercel",
  "cursor",
  "github",
  "nuxt-vue",
  "laravel-php",
  "node-npm",
  "other",
]);

export const veilleIngestItemSchema = z.object({
  date: isoDay,
  category: categorySchema,
  provider: providerSchema,
  severity: z.enum(["critique", "elevee", "moyenne", "info"]),
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(2000),
  quoi: z.string().max(8000).optional(),
  impact: z.string().max(8000).optional(),
  link: z.string().url().max(2000),
  affected_versions: z.array(z.string().max(120)).max(40).optional(),
  fixed_versions: z.array(z.string().max(120)).max(40).optional(),
  stars_week: z.number().int().min(0).nullable().optional(),
  stars_month: z.number().int().min(0).nullable().optional(),
  price_info: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(80)).max(30).optional(),
});

export type ParsedVeilleIngestItem = VeilleIngestItem;

export function parseVeilleIngestBody(body: unknown): ParsedVeilleIngestItem[] {
  if (Array.isArray(body)) {
    return body.map((row) => veilleIngestItemSchema.parse(row));
  }
  if (body && typeof body === "object" && "items" in body) {
    const items = (body as { items: unknown }).items;
    if (!Array.isArray(items)) {
      throw new Error("items must be an array");
    }
    return items.map((row) => veilleIngestItemSchema.parse(row));
  }
  return [veilleIngestItemSchema.parse(body)];
}

export function veilleIngestRow(item: ParsedVeilleIngestItem) {
  return {
    feed_date: item.date,
    category: item.category,
    provider: item.provider,
    severity: item.severity,
    title: item.title.trim(),
    summary: item.summary.trim(),
    quoi: (item.quoi ?? "").trim(),
    impact: (item.impact ?? "").trim(),
    link: item.link.trim(),
    affected_versions: item.affected_versions ?? [],
    fixed_versions: item.fixed_versions ?? [],
    stars_week: item.stars_week ?? null,
    stars_month: item.stars_month ?? null,
    price_info: item.price_info ?? null,
    tags: item.tags ?? [],
  };
}
