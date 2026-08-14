import { foldCase } from "@/lib/text";
import {
  expandWithParentCountries,
  resolveLocation,
  resolveLocations,
  type JobLocation,
} from "@/modules/job-board/locations";
import { acceptsWorkMode, wantsRemote } from "@/modules/job-board/work-modes";
import type { JobSearchPrefs, JobWorkMode } from "@/modules/job-board/types";

const FRANCE_HINT =
  /\b(france|francais|français|french|paris|lyon|marseille|toulouse|lille|nantes|bordeaux|rennes|grenoble|montpellier|strasbourg|nice|rouen|tours|dijon|orleans|orléans|clermont|angers|le havre|reims|ile[- ]de[- ]france|île-de-france|\bidf\b|hauts-de-seine|seine-saint-denis|val-de-marne)\b/i;

const EUROPE_HINT =
  /\b(europe|european union|\beu\b|\bue\b|emea|belgium|belgique|switzerland|suisse|luxembourg|germany|allemagne|netherlands|pays-bas|spain|espagne|portugal|italy|italie|united kingdom|\buk\b)\b/i;

const WORLDWIDE_ONLY =
  /\b(worldwide|anywhere in the world|global remote|united states|\busa\b|\bus only\b|india\b|philippines|pakistan|bangladesh|latam|south america|asia only|africa only)\b/i;

const REMOTE_RE =
  /\b(remote|fully remote|full[- ]remote|télétravail|teletravail|100\s*%\s*remote|wfh|work from home)\b/i;

const HYBRID_RE =
  /\b(hybrid|hybride|flex office|2j|3j|quelques jours|office \+ remote)\b/i;

const ONSITE_RE =
  /\b(onsite|on-site|présentiel|presentiel|sur site|au bureau|office based)\b/i;

const ROLE_STOPWORDS = new Set([
  "dev",
  "developer",
  "developpeur",
  "développeur",
  "engineer",
  "ingenieur",
  "ingénieur",
  "software",
  "poste",
  "emploi",
  "job",
  "senior",
  "junior",
  "confirmé",
  "confirme",
]);

const CITY_ALIASES: Record<string, string[]> = {
  paris: [
    "ile de france",
    "île-de-france",
    "idf",
    "hauts de seine",
    "nanterre",
    "boulogne",
    "saint denis",
  ],
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

function haystack(location: string | null | undefined, blob = ""): string {
  return foldCase(`${location ?? ""} ${blob}`);
}

function locationVariants(entry: JobLocation): string[] {
  const extras = CITY_ALIASES[entry.id] ?? [];
  return [
    entry.id,
    foldCase(entry.label),
    foldCase(entry.indeed),
    ...entry.aliases.map(foldCase),
    ...extras.map(foldCase),
  ].filter(Boolean);
}

export function locationMatches(
  entry: JobLocation,
  location: string | null | undefined,
  extra = "",
): boolean {
  const hay = haystack(location, extra);
  if (!hay) return false;
  if (entry.id === "monde") return true;
  if (entry.id === "europe") return EUROPE_HINT.test(hay) || FRANCE_HINT.test(hay);
  if (entry.id === "afrique") {
    return /\b(africa|afrique|maroc|morocco|alger|tunis|dakar|senegal|egypt|nigeria|kenya)\b/i.test(hay);
  }
  if (entry.kind === "country" || entry.kind === "region") {
    return locationVariants(entry).some((variant) => hay.includes(variant));
  }
  return locationVariants(entry).some((variant) => hay.includes(variant));
}

export function anyLocationMatches(
  selected: JobLocation[],
  location: string | null | undefined,
  extra = "",
): boolean {
  if (selected.length === 0) return true;
  return selected.some((entry) => locationMatches(entry, location, extra));
}

/** Keep offers in the selected countries; drop US-only / worldwide dumps. */
export function isCredibleRegion(
  location: string | null | undefined,
  blob = "",
  selected: JobLocation[] = [],
): boolean {
  const text = `${location ?? ""} ${blob}`;
  if (selected.length > 0) {
    return anyLocationMatches(selected, location, blob);
  }
  if (WORLDWIDE_ONLY.test(text) && !FRANCE_HINT.test(text) && !EUROPE_HINT.test(text)) {
    return false;
  }
  if (FRANCE_HINT.test(text) || EUROPE_HINT.test(text)) return true;
  if (!location || !location.trim()) return false;
  return FRANCE_HINT.test(location) || EUROPE_HINT.test(location);
}

function cityVariants(city: string): string[] {
  const folded = foldCase(city);
  if (!folded) return [];
  const extra = CITY_ALIASES[folded] ?? [];
  return [folded, ...extra.map(foldCase)];
}

/** @deprecated Prefer locationMatches — kept for existing tests. */
export function cityMatches(
  city: string,
  location: string | null | undefined,
  extra = "",
): boolean {
  if (!city.trim()) return true;
  return locationMatches(resolveLocation(city), location, extra) ||
    cityVariants(city).some((variant) => haystack(location, extra).includes(variant));
}

function roleTokens(roleQuery: string): { specific: string[]; generic: string[] } {
  const tokens = foldCase(roleQuery)
    .split(/[^a-z0-9+]+/)
    .filter((token) => token.length >= 2);
  const specific = tokens.filter((token) => !ROLE_STOPWORDS.has(token));
  const generic = tokens.filter((token) => ROLE_STOPWORDS.has(token));
  return { specific, generic };
}

export function roleMatches(roleQuery: string, blob: string): boolean {
  const role = foldCase(roleQuery);
  if (role.length < 2) return true;
  const hay = foldCase(blob);
  const { specific, generic } = roleTokens(roleQuery);
  const needles = specific.length > 0 ? specific : generic;
  if (needles.length === 0) return true;
  return needles.some((token) => hay.includes(token));
}

export function roleMatchesAny(prefs: JobSearchPrefs, blob: string): boolean {
  const needles =
    prefs.roles.length > 0 ? prefs.roles : prefs.roleQuery.trim() ? [prefs.roleQuery] : [];
  if (needles.length === 0) return true;
  return needles.some((role) => roleMatches(role, blob));
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
  const selected = resolveLocations(prefs.locations);
  const region = wantsRemote(prefs) ? expandWithParentCountries(selected) : selected;
  const blob = `${listing.title} ${listing.description ?? ""} ${listing.tags.join(" ")}`;
  if (!isCredibleRegion(listing.location, blob, region)) return false;

  const mode = listing.workMode ?? classifyWorkMode({
    title: listing.title,
    description: listing.description ?? "",
    location: listing.location ?? undefined,
    tags: listing.tags,
  });

  if (!acceptsWorkMode(prefs, mode)) return false;

  if (mode !== "remote" && selected.length > 0) {
    if (!anyLocationMatches(selected, listing.location, blob)) return false;
  }

  const roleNeedles =
    prefs.roles.length > 0 ? prefs.roles : prefs.roleQuery.trim() ? [prefs.roleQuery] : [];
  if (roleNeedles.length === 0) return true;
  return roleMatchesAny(prefs, blob);
}
