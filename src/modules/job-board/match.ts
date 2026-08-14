import { foldCase } from "@/lib/text";
import type { JobSearchPrefs, JobWorkMode } from "@/modules/job-board/types";

const FRANCE_HINT =
  /\b(france|francais|français|french|paris|lyon|marseille|toulouse|lille|nantes|bordeaux|rennes|grenoble|montpellier|strasbourg|nice|rouen|tours|dijon|orleans|orléans|clermont|angers|le havre|reims|ile[- ]de[- ]france|île-de-france|\bidf\b|hauts-de-seine|seine-saint-denis|val-de-marne|europe|european union|\beu\b|\bue\b|emea)\b/i;

const WORLDWIDE_ONLY =
  /\b(worldwide|anywhere in the world|global remote|united states|\busa\b|\bus only\b|india\b|philippines|pakistan|bangladesh|latam|south america|asia only|africa only)\b/i;

const REMOTE_RE =
  /\b(remote|fully remote|full[- ]remote|télétravail|teletravail|100\s*%\s*remote|wfh|work from home)\b/i;

const HYBRID_RE =
  /\b(hybrid|hybride|flex office|2j|3j|quelques jours|office \+ remote)\b/i;

const ONSITE_RE =
  /\b(onsite|on-site|présentiel|presentiel|sur site|au bureau|office based)\b/i;

const CITY_ALIASES: Record<string, string[]> = {
  paris: ["ile de france", "île-de-france", "idf", "hauts de seine", "nanterre", "boulogne", "saint denis"],
  lyon: ["villeurbanne", "rhone", "rhône"],
  lille: ["roubaix", "tourcoing", "nord"],
  marseille: ["aix en provence", "bouches du rhone"],
  toulouse: ["haute garonne"],
  nantes: ["loire atlantique"],
  bordeaux: ["gironde"],
};

export function classifyWorkMode(hit: {
  title: string;
  description: string;
  location?: string;
  tags?: string[];
  workMode?: JobWorkMode | null;
}): JobWorkMode {
  if (hit.workMode) return hit.workMode;
  const blob = `${hit.title} ${hit.description} ${hit.location ?? ""} ${(hit.tags ?? []).join(" ")}`;
  if (HYBRID_RE.test(blob)) return "hybrid";
  if (REMOTE_RE.test(blob) && !ONSITE_RE.test(blob)) return "remote";
  if (ONSITE_RE.test(blob)) return "onsite";
  if (REMOTE_RE.test(blob)) return "remote";
  return "onsite";
}

/** France / EU — drop US-only and generic worldwide boards. */
export function isCredibleRegion(location: string | null | undefined, blob = ""): boolean {
  const text = `${location ?? ""} ${blob}`;
  if (FRANCE_HINT.test(text)) return true;
  if (WORLDWIDE_ONLY.test(text) && !FRANCE_HINT.test(text)) return false;
  if (!location || !location.trim()) return false;
  return FRANCE_HINT.test(location);
}

function cityVariants(city: string): string[] {
  const folded = foldCase(city);
  if (!folded) return [];
  const extra = CITY_ALIASES[folded] ?? [];
  return [folded, ...extra.map(foldCase)];
}

export function cityMatches(city: string, location: string | null | undefined, extra = ""): boolean {
  const variants = cityVariants(city);
  if (variants.length === 0) return true;
  const hay = foldCase(`${location ?? ""} ${extra}`);
  if (!hay) return false;
  if (hay.includes("france") && variants.includes("france")) return true;
  return variants.some((variant) => hay.includes(variant));
}

export function matchesSearchPrefs(
  listing: {
    title: string;
    description: string | null;
    location: string | null;
    tags: string[];
    workMode: JobWorkMode | null;
  },
  prefs: JobSearchPrefs,
): boolean {
  const blob = `${listing.title} ${listing.description ?? ""} ${listing.tags.join(" ")}`;
  if (!isCredibleRegion(listing.location, blob)) return false;

  const mode = listing.workMode ?? classifyWorkMode({
    title: listing.title,
    description: listing.description ?? "",
    location: listing.location ?? undefined,
    tags: listing.tags,
  });

  if (prefs.workMode === "remote") {
    if (mode === "onsite") return false;
  } else if (prefs.workMode === "onsite") {
    if (mode === "remote") return false;
    if (!cityMatches(prefs.city, listing.location, blob)) return false;
  } else if (prefs.workMode === "hybrid") {
    if (mode === "remote") {
      /* remote-friendly hybrid search still accepts full remote in France */
    } else if (!cityMatches(prefs.city, listing.location, blob) && prefs.city.trim()) {
      return false;
    }
  }

  const role = foldCase(prefs.roleQuery);
  if (role.length >= 2) {
    const tokens = role.split(/[^a-z0-9]+/).filter((token) => token.length >= 2);
    const hay = foldCase(blob);
    const hits = tokens.filter((token) => hay.includes(token));
    if (hits.length === 0) return false;
  }

  return true;
}
