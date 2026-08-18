import { foldCase } from "@/lib/text";
import {
  CATALOG_CITIES,
  CATALOG_COUNTRIES,
  POPULAR_LOCATION_IDS,
  type JobLocation,
} from "@/modules/job-board/location-catalog";

export type { JobLocation, JobLocationKind } from "@/modules/job-board/location-catalog";

export const JOB_LOCATIONS: JobLocation[] = [...CATALOG_COUNTRIES, ...CATALOG_CITIES].filter(
  (entry, index, all) => all.findIndex((other) => other.id === entry.id) === index,
);

const BY_ID = new Map(JOB_LOCATIONS.map((entry) => [entry.id, entry]));

export const MAX_JOB_LOCATIONS = 8;

export function resolveLocation(raw: string): JobLocation {
  const trimmed = raw.trim();
  const folded = foldCase(trimmed);
  if (!folded) {
    return BY_ID.get("france") ?? CATALOG_COUNTRIES[0]!;
  }
  const exact = BY_ID.get(folded);
  if (exact) return exact;
  const aliased = JOB_LOCATIONS.find(
    (entry) =>
      foldCase(entry.label) === folded ||
      entry.aliases.some((alias) => foldCase(alias) === folded),
  );
  if (aliased) return aliased;
  return {
    id: folded,
    label: trimmed,
    kind: "city",
    countryId: folded,
    aliases: [],
    indeed: trimmed,
  };
}

export function resolveLocations(ids: string[], max = MAX_JOB_LOCATIONS): JobLocation[] {
  const seen = new Set<string>();
  const resolved: JobLocation[] = [];
  for (const id of ids) {
    const location = resolveLocation(id);
    if (seen.has(location.id)) continue;
    seen.add(location.id);
    resolved.push(location);
    if (resolved.length >= max) break;
  }
  return resolved;
}

/** Cities also match their country on remote feeds (Casablanca → Maroc). */
export function expandWithParentCountries(selected: JobLocation[]): JobLocation[] {
  const ids = [
    ...selected.map((entry) => entry.id),
    ...selected
      .filter((entry) => entry.kind === "city" && entry.countryId !== entry.id)
      .map((entry) => entry.countryId),
  ];
  return resolveLocations(ids, MAX_JOB_LOCATIONS + 8);
}

export function citiesInCountry(countryId: string): JobLocation[] {
  return CATALOG_CITIES.filter((city) => city.countryId === countryId);
}

/** European catalog ids — Arbeitnow / remote "Europe" feeds. */
export const EUROPEAN_COUNTRY_IDS = new Set([
  "europe",
  "france",
  "belgique",
  "suisse",
  "luxembourg",
  "allemagne",
  "pays-bas",
  "espagne",
  "portugal",
  "italie",
  "royaume-uni",
  "irlande",
  "autriche",
  "pologne",
  "roumanie",
  "republique-tcheque",
  "suede",
  "norvege",
  "danemark",
  "finlande",
  "grece",
  "hongrie",
  "bulgarie",
  "croatie",
  "serbie",
]);

export function isMoroccoPlace(entry: JobLocation): boolean {
  return entry.id === "maroc" || entry.countryId === "maroc";
}

export function isEuropeanPlace(entry: JobLocation): boolean {
  return (
    entry.id === "europe" ||
    entry.id === "monde" ||
    EUROPEAN_COUNTRY_IDS.has(entry.id) ||
    EUROPEAN_COUNTRY_IDS.has(entry.countryId)
  );
}

function scoreMatch(location: JobLocation, query: string): number {
  const folded = foldCase(query);
  if (!folded) return 0;
  const label = foldCase(location.label);
  const id = location.id;
  const aliases = location.aliases.map(foldCase);
  if (label === folded || id === folded) return 100;
  if (aliases.includes(folded)) return 90;
  if (label.startsWith(folded) || id.startsWith(folded)) return 80;
  if (aliases.some((alias) => alias.startsWith(folded))) return 70;
  if (label.includes(folded) || id.includes(folded)) return 50;
  if (aliases.some((alias) => alias.includes(folded))) return 40;
  return 0;
}

/** Closest catalog matches for a typed query (cities and countries). */
export function suggestLocations(
  query: string,
  selectedIds: string[] = [],
  limit = 8,
): JobLocation[] {
  const selected = new Set(selectedIds.map((id) => resolveLocation(id).id));
  const folded = foldCase(query);

  if (!folded) {
    return POPULAR_LOCATION_IDS.map((id) => BY_ID.get(id))
      .filter((entry): entry is JobLocation => entry != null && !selected.has(entry.id))
      .slice(0, limit);
  }

  return JOB_LOCATIONS.filter((entry) => !selected.has(entry.id))
    .map((entry) => ({ entry, score: scoreMatch(entry, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label, "fr"))
    .slice(0, limit)
    .map((row) => row.entry);
}
