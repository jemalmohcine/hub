export type AiPillar = "models" | "tools" | "opensource" | "world";
export type AiUrgency = "urgent" | "medium" | "light";
export type SourceKind = "rss" | "html" | "api";
export type SourceStatus = "active" | "candidate" | "disabled";

export type AiCategory =
  | "new_model"
  | "upgrade"
  | "deprecation"
  | "pricing"
  | "capacity"
  | "ide"
  | "cli"
  | "mcp"
  | "sdk"
  | "software"
  | "trending_repo"
  | "release"
  | "library"
  | "regulation"
  | "ban"
  | "policy"
  | "country"
  | "general";

export type SourceRef = {
  sourceId: string;
  url: string;
  title: string;
};

export type AiIntelSource = {
  id: string;
  name: string;
  url: string;
  kind: SourceKind;
  pillar_hints: AiPillar[];
  priority: number;
  enabled: boolean;
  status: SourceStatus;
  quality_score: number;
  last_ok_at: string | null;
  last_error: string | null;
  discovered_at: string | null;
  discovery_reason: string | null;
  metadata: Record<string, unknown>;
};

export type RawHit = {
  title: string;
  summary: string;
  url: string;
  sourceId: string;
  externalId: string;
  publishedAt: string | null;
  raw?: Record<string, unknown>;
};

export type ClassifiedItem = {
  canonicalKey: string;
  pillar: AiPillar;
  category: AiCategory;
  urgency: AiUrgency;
  title: string;
  summary: string;
  url: string;
  primarySource: string;
  sourceRefs: SourceRef[];
  publishedAt: string | null;
  metadata: Record<string, unknown>;
};

export type AiIntelItem = {
  id: string;
  canonical_key: string;
  pillar: AiPillar;
  category: string;
  urgency: AiUrgency;
  title: string;
  summary: string;
  url: string;
  primary_source: string;
  source_refs: SourceRef[];
  metadata: Record<string, unknown>;
  published_at: string | null;
  ingested_at: string;
  updated_at: string;
  saved?: boolean;
  read?: boolean;
};

export type AiIntelRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "partial" | "failed";
  discovery: Record<string, unknown>;
  source_stats: Record<string, unknown>;
  merge_stats: Record<string, unknown>;
  error: string | null;
};

export type FeedFilters = {
  pillar?: AiPillar | "all";
  urgency?: AiUrgency | "all";
  category?: string | "all";
  savedOnly?: boolean;
  q?: string;
};

export const PILLAR_LABELS: Record<AiPillar, string> = {
  models: "Models & APIs",
  tools: "Tools",
  opensource: "Open Source",
  world: "World",
};

export const URGENCY_LABELS: Record<AiUrgency, string> = {
  urgent: "Priority",
  medium: "Recommended",
  light: "Secondary",
};
