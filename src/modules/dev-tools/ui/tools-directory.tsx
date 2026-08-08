"use client";

import { useMemo, useState } from "react";
import {
  Award,
  ChevronDown,
  ExternalLink,
  Gift,
  GitBranch,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Badge,
  BulletList,
  Card,
  Cluster,
  EmptyState,
  Input,
  Stack,
  Text,
} from "@/design-system";
import type { DevTool, PriceFilter, ToolCategory, ToolSort } from "@/modules/dev-tools/types";
import {
  AUDIENCE_LABELS,
  MATURITY_LABELS,
  PRICE_FILTERS,
  PRICE_FILTER_LABELS,
  PRICING_LABELS,
  SORT_LABELS,
  TOOL_SORTS,
} from "@/modules/dev-tools/types";
import { CATEGORY_LABELS, EXPENSE_CATEGORIES } from "@/modules/dev-expenses/types";
import { priceRank } from "@/modules/dev-tools/scoring";
import { formatDate } from "@/lib/dates";
import { formatCompactNumber } from "@/lib/numbers";
import { cn } from "@/lib/utils";

type CategoryFilter = ToolCategory | "all";

export function ToolsDirectory({
  tools,
  ownedSlugs,
  freshness,
}: {
  tools: DevTool[];
  /** Slugs the user already pays for, so the catalogue can say so. */
  ownedSlugs: string[];
  freshness: string | null;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<ToolSort>("overall");

  const owned = useMemo(() => new Set(ownedSlugs), [ownedSlugs]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = tools.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!matchesPrice(tool, price)) return false;
      if (!needle) return true;
      return (
        tool.name.toLowerCase().includes(needle) ||
        (tool.tagline ?? "").toLowerCase().includes(needle) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });

    return [...filtered].sort(comparator(sort));
  }, [tools, query, category, price, sort]);

  const podium = useMemo(() => buildPodium(visible), [visible]);

  return (
    <Stack gap={4} className="pb-8">
      <Stack gap={2}>
        <Cluster gap={2} className="justify-between">
          <Text size="sm" tone="muted">
            {tools.length} outils suivis
            {freshness ? ` · mis à jour le ${formatDate(freshness, "fr", "dayMonth")}` : ""}
          </Text>
        </Cluster>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un outil, une techno…"
            className="pl-9"
            aria-label="Chercher un outil"
          />
        </div>

        <PillRow
          label="Catégorie"
          options={[
            { id: "all" as const, label: "Toutes" },
            ...EXPENSE_CATEGORIES.map((c) => ({ id: c, label: CATEGORY_LABELS[c] })),
          ]}
          active={category}
          onSelect={setCategory}
        />

        <PillRow
          label="Tarif"
          options={PRICE_FILTERS.map((p) => ({ id: p, label: PRICE_FILTER_LABELS[p] }))}
          active={price}
          onSelect={setPrice}
        />

        <PillRow
          label="Tri"
          options={TOOL_SORTS.map((s) => ({ id: s, label: SORT_LABELS[s] }))}
          active={sort}
          onSelect={setSort}
        />
      </Stack>

      {podium.length > 0 ? <Podium entries={podium} /> : null}

      <Stack gap={2}>
        {visible.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} owned={owned.has(tool.slug)} />
        ))}

        {visible.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Aucun outil ne correspond"
            hint={
              tools.length === 0
                ? "Le catalogue se remplit à la prochaine exécution du scrape quotidien."
                : "Élargis la recherche ou change de filtre."
            }
          />
        ) : null}
      </Stack>
    </Stack>
  );
}

function matchesPrice(tool: DevTool, filter: PriceFilter): boolean {
  if (filter === "all") return true;
  if (filter === "free") return tool.hasFreeTier;
  if (filter === "open_source") return tool.pricingModel === "open_source";
  if (filter === "freemium") return tool.pricingModel === "freemium";
  return tool.pricingModel === "paid" || tool.pricingModel === "usage";
}

function comparator(sort: ToolSort): (a: DevTool, b: DevTool) => number {
  if (sort === "popularity") return (a, b) => b.popularityScore - a.popularityScore;
  if (sort === "stability") return (a, b) => b.stabilityScore - a.stabilityScore;
  if (sort === "fresh") {
    return (a, b) =>
      Date.parse(b.lastCommitAt ?? b.updatedAt) - Date.parse(a.lastCommitAt ?? a.updatedAt);
  }
  if (sort === "price") {
    return (a, b) =>
      priceRank(a.hasFreeTier, a.startingPriceEur) - priceRank(b.hasFreeTier, b.startingPriceEur) ||
      b.overallScore - a.overallScore;
  }
  return (a, b) => b.overallScore - a.overallScore;
}

type PodiumEntry = { icon: LucideIcon; label: string; tool: DevTool };

/** The three answers people actually want: best known, safest, best free one. */
function buildPodium(tools: DevTool[]): PodiumEntry[] {
  if (tools.length < 3) return [];

  const best = (pick: (t: DevTool) => number, pool = tools) =>
    pool.reduce<DevTool | null>((top, t) => (!top || pick(t) > pick(top) ? t : top), null);

  const known = best((t) => t.popularityScore);
  const stable = best((t) => t.stabilityScore);
  const free = best(
    (t) => t.overallScore,
    tools.filter((t) => t.hasFreeTier),
  );

  const entries: PodiumEntry[] = [];
  if (known) entries.push({ icon: Star, label: "Le plus connu", tool: known });
  if (stable) entries.push({ icon: ShieldCheck, label: "Le plus stable", tool: stable });
  if (free) entries.push({ icon: Gift, label: "Le meilleur gratuit", tool: free });

  return entries;
}

function Podium({ entries }: { entries: PodiumEntry[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {entries.map(({ icon: Icon, label, tool }) => (
        <Card key={label} className="border-[var(--dh-brand)]/30 p-3">
          <Cluster gap={2} className="items-center">
            <Icon className="h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
            <Text size="sm" tone="muted">
              {label}
            </Text>
          </Cluster>
          <Text weight="medium" className="mt-1 break-words">
            {tool.name}
          </Text>
          <Text size="sm" tone="muted" className="break-words">
            {priceLabel(tool)}
          </Text>
        </Card>
      ))}
    </div>
  );
}

function priceLabel(tool: DevTool): string {
  if (tool.pricingModel === "open_source") return "Open source, auto-hébergeable";
  if (tool.hasFreeTier && tool.startingPriceEur != null) {
    return `Gratuit, puis ${tool.startingPriceEur} €/mois`;
  }
  if (tool.hasFreeTier) return "Plan gratuit disponible";
  if (tool.startingPriceEur != null) return `À partir de ${tool.startingPriceEur} €/mois`;
  if (tool.pricingModel === "usage") return "Facturé à l’usage";
  return "Tarif non déterminé";
}

function PillRow<T extends string>({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: { id: T; label: string }[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          aria-pressed={active === option.id}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-[length:var(--dh-text-sm)] transition-colors",
            active === option.id
              ? "border-[var(--dh-brand)] bg-[var(--dh-brand)]/10 font-medium text-[var(--dh-brand)]"
              : "border-border text-muted-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ToolCard({ tool, owned }: { tool: DevTool; owned: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-2 p-4 text-left"
      >
        <span className="min-w-0">
          <Cluster gap={2} className="items-center">
            <Text weight="medium" className="break-words">
              {tool.name}
            </Text>
            {owned ? <Badge tone="brand">Tu le paies</Badge> : null}
          </Cluster>

          {tool.tagline ? (
            <Text size="sm" tone="muted" className="mt-0.5 break-words">
              {tool.tagline}
            </Text>
          ) : null}

          <Cluster gap={1} className="mt-2 flex-wrap">
            <Badge tone={tool.hasFreeTier ? "success" : "neutral"}>{priceLabel(tool)}</Badge>
            <Badge tone="neutral">{CATEGORY_LABELS[tool.category]}</Badge>
            {tool.pricingModel === "open_source" ? (
              <Badge tone="info">{PRICING_LABELS.open_source}</Badge>
            ) : null}
            {tool.stars != null ? (
              <Badge tone="neutral">
                <Star className="mr-1 inline h-3 w-3" />
                {formatCompactNumber(tool.stars)}
              </Badge>
            ) : null}
          </Cluster>

          <div className="mt-3 grid max-w-sm grid-cols-2 gap-3">
            <ScoreBar label="Notoriété" value={tool.popularityScore} />
            <ScoreBar label="Stabilité" value={tool.stabilityScore} />
          </div>
        </span>

        <ChevronDown
          className={cn("mt-1 h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? <ToolDetail tool={tool} /> : null}
    </Card>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 75 ? "bg-success" : value >= 45 ? "bg-warning" : "bg-muted-foreground";

  return (
    <div>
      <Cluster gap={2} className="justify-between">
        <Text size="sm" tone="muted">
          {label}
        </Text>
        <Text size="sm" weight="medium" className="tabular-nums">
          {value}
        </Text>
      </Cluster>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ToolDetail({ tool }: { tool: DevTool }) {
  return (
    <div className="border-t border-border px-4 py-3">
      <Stack gap={3}>
        {tool.summary ? (
          <Text size="sm" className="leading-relaxed break-words">
            {tool.summary}
          </Text>
        ) : null}

        {tool.hasFreeTier && tool.freeTierNote ? (
          <Cluster gap={2} className="items-start">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <Text size="sm" className="break-words">
              {tool.freeTierNote}
            </Text>
          </Cluster>
        ) : null}

        {tool.bestFor ? (
          <Cluster gap={2} className="items-start">
            <Award className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
            <Text size="sm" className="break-words">
              Idéal pour : {tool.bestFor}
            </Text>
          </Cluster>
        ) : null}

        {tool.pros.length > 0 ? (
          <div>
            <Text size="sm" weight="medium">
              Avantages
            </Text>
            <div className="mt-1">
              <BulletList items={tool.pros} />
            </div>
          </div>
        ) : null}

        {tool.cons.length > 0 ? (
          <div>
            <Text size="sm" weight="medium">
              Limites
            </Text>
            <div className="mt-1">
              <BulletList items={tool.cons} />
            </div>
          </div>
        ) : null}

        <Cluster gap={1} className="flex-wrap">
          <Badge tone="neutral">{MATURITY_LABELS[tool.maturity]}</Badge>
          <Badge tone="neutral">{AUDIENCE_LABELS[tool.audience]}</Badge>
          {tool.license ? <Badge tone="neutral">{tool.license}</Badge> : null}
          {tool.lastReleaseAt ? (
            <Badge tone="neutral">
              Dernière version {formatDate(tool.lastReleaseAt, "fr", "dayMonthYear")}
            </Badge>
          ) : null}
          {tool.isArchived ? <Badge tone="danger">Projet archivé</Badge> : null}
        </Cluster>

        {tool.tags.length > 0 ? (
          <Cluster gap={1} className="flex-wrap">
            {tool.tags.map((tag) => (
              <Badge key={tag} tone="info">
                {tag}
              </Badge>
            ))}
          </Cluster>
        ) : null}

        <Cluster gap={3} className="flex-wrap">
          {tool.websiteUrl ? <DetailLink href={tool.websiteUrl} icon={ExternalLink} label="Site" /> : null}
          {tool.pricingUrl ? <DetailLink href={tool.pricingUrl} icon={ExternalLink} label="Tarifs" /> : null}
          {tool.repoFullName ? (
            <DetailLink
              href={`https://github.com/${tool.repoFullName}`}
              icon={GitBranch}
              label={tool.repoFullName}
            />
          ) : null}
        </Cluster>
      </Stack>
    </div>
  );
}

function DetailLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[length:var(--dh-text-sm)] font-medium text-[var(--dh-brand)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
