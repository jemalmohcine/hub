import { foldCase } from "@/lib/text";

export type JobLocationKind = "city" | "country" | "region";

export type JobLocation = {
  id: string;
  label: string;
  kind: JobLocationKind;
  /** Parent country id (`france`, `belgique`, …). */
  countryId: string;
  aliases: string[];
  /** Indeed `l=` parameter. */
  indeed: string;
  /** Jobicy `geo=` when this is a country (remote feeds). */
  jobicyGeo?: string;
};

const COUNTRIES: JobLocation[] = [
  {
    id: "france",
    label: "France",
    kind: "country",
    countryId: "france",
    aliases: ["fr", "french", "hexagone"],
    indeed: "France",
    jobicyGeo: "france",
  },
  {
    id: "belgique",
    label: "Belgique",
    kind: "country",
    countryId: "belgique",
    aliases: ["belgium", "be", "belgian"],
    indeed: "Belgium",
    jobicyGeo: "belgium",
  },
  {
    id: "suisse",
    label: "Suisse",
    kind: "country",
    countryId: "suisse",
    aliases: ["switzerland", "swiss", "ch"],
    indeed: "Switzerland",
    jobicyGeo: "switzerland",
  },
  {
    id: "luxembourg",
    label: "Luxembourg",
    kind: "country",
    countryId: "luxembourg",
    aliases: ["lu"],
    indeed: "Luxembourg",
    jobicyGeo: "luxembourg",
  },
  {
    id: "allemagne",
    label: "Allemagne",
    kind: "country",
    countryId: "allemagne",
    aliases: ["germany", "de", "deutschland"],
    indeed: "Germany",
    jobicyGeo: "germany",
  },
  {
    id: "pays-bas",
    label: "Pays-Bas",
    kind: "country",
    countryId: "pays-bas",
    aliases: ["netherlands", "holland", "nl"],
    indeed: "Netherlands",
    jobicyGeo: "netherlands",
  },
  {
    id: "espagne",
    label: "Espagne",
    kind: "country",
    countryId: "espagne",
    aliases: ["spain", "es", "espana", "españa"],
    indeed: "Spain",
    jobicyGeo: "spain",
  },
  {
    id: "portugal",
    label: "Portugal",
    kind: "country",
    countryId: "portugal",
    aliases: ["pt"],
    indeed: "Portugal",
    jobicyGeo: "portugal",
  },
  {
    id: "italie",
    label: "Italie",
    kind: "country",
    countryId: "italie",
    aliases: ["italy", "it"],
    indeed: "Italy",
    jobicyGeo: "italy",
  },
  {
    id: "royaume-uni",
    label: "Royaume-Uni",
    kind: "country",
    countryId: "royaume-uni",
    aliases: ["uk", "united kingdom", "britain", "england"],
    indeed: "United Kingdom",
    jobicyGeo: "uk",
  },
  {
    id: "canada",
    label: "Canada",
    kind: "country",
    countryId: "canada",
    aliases: ["ca", "quebec", "québec"],
    indeed: "Canada",
    jobicyGeo: "canada",
  },
  {
    id: "europe",
    label: "Europe",
    kind: "region",
    countryId: "europe",
    aliases: ["eu", "ue", "emea", "european union"],
    indeed: "Europe",
  },
];

const CITIES: JobLocation[] = [
  city("paris", "Paris", "france", ["idf", "ile de france", "île-de-france", "75"], "Paris"),
  city("lyon", "Lyon", "france", ["villeurbanne", "69", "rhone", "rhône"], "Lyon"),
  city("marseille", "Marseille", "france", ["13", "aix"], "Marseille"),
  city("toulouse", "Toulouse", "france", ["31", "haute garonne"], "Toulouse"),
  city("lille", "Lille", "france", ["59", "roubaix", "tourcoing", "nord"], "Lille"),
  city("nantes", "Nantes", "france", ["44", "loire atlantique"], "Nantes"),
  city("bordeaux", "Bordeaux", "france", ["33", "gironde"], "Bordeaux"),
  city("rennes", "Rennes", "france", ["35", "bretagne"], "Rennes"),
  city("grenoble", "Grenoble", "france", ["38", "isere", "isère"], "Grenoble"),
  city("montpellier", "Montpellier", "france", ["34"], "Montpellier"),
  city("strasbourg", "Strasbourg", "france", ["67", "alsace"], "Strasbourg"),
  city("nice", "Nice", "france", ["06", "cote d azur", "côte d'azur"], "Nice"),
  city("rouen", "Rouen", "france", ["76", "normandie"], "Rouen"),
  city("tours", "Tours", "france", ["37"], "Tours"),
  city("dijon", "Dijon", "france", ["21"], "Dijon"),
  city("angers", "Angers", "france", ["49"], "Angers"),
  city("clermont-ferrand", "Clermont-Ferrand", "france", ["clermont", "63"], "Clermont-Ferrand"),
  city("reims", "Reims", "france", ["51"], "Reims"),
  city("aix-en-provence", "Aix-en-Provence", "france", ["aix"], "Aix-en-Provence"),
  city("orleans", "Orléans", "france", ["orleans", "45"], "Orléans"),
  city("metz", "Metz", "france", ["57"], "Metz"),
  city("nancy", "Nancy", "france", ["54"], "Nancy"),
  city("caen", "Caen", "france", ["14"], "Caen"),
  city("brest", "Brest", "france", ["29"], "Brest"),
  city("annecy", "Annecy", "france", ["74", "haute savoie"], "Annecy"),
  city("toulon", "Toulon", "france", ["83"], "Toulon"),
  city("ile-de-france", "Île-de-France", "france", ["idf", "paris region"], "Île-de-France"),
  city("bruxelles", "Bruxelles", "belgique", ["brussels", "brussel"], "Brussels"),
  city("liege", "Liège", "belgique", ["liege"], "Liège"),
  city("geneve", "Genève", "suisse", ["geneva", "genève"], "Geneva"),
  city("lausanne", "Lausanne", "suisse", [], "Lausanne"),
  city("zurich", "Zurich", "suisse", ["zürich"], "Zurich"),
  city("montreal", "Montréal", "canada", ["montreal"], "Montreal"),
];

function city(
  id: string,
  label: string,
  countryId: string,
  aliases: string[],
  indeed: string,
): JobLocation {
  return { id, label, kind: "city", countryId, aliases, indeed };
}

const DEDUPED_CITIES = CITIES.filter(
  (entry, index, all) => all.findIndex((other) => other.id === entry.id) === index,
);

export const JOB_LOCATIONS: JobLocation[] = [...COUNTRIES, ...DEDUPED_CITIES].filter(
  (entry, index, all) => all.findIndex((other) => other.id === entry.id) === index,
);

const BY_ID = new Map(JOB_LOCATIONS.map((entry) => [entry.id, entry]));

const POPULAR_IDS = [
  "france",
  "paris",
  "lyon",
  "lille",
  "nantes",
  "bordeaux",
  "toulouse",
  "belgique",
  "suisse",
  "luxembourg",
  "europe",
];

export const MAX_JOB_LOCATIONS = 8;

export function resolveLocation(raw: string): JobLocation {
  const trimmed = raw.trim();
  const folded = foldCase(trimmed);
  if (!folded) {
    return {
      id: "france",
      label: "France",
      kind: "country",
      countryId: "france",
      aliases: [],
      indeed: "France",
      jobicyGeo: "france",
    };
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
    countryId: "france",
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

/** Cities also match their country on remote feeds (Paris → France). */
export function expandWithParentCountries(selected: JobLocation[]): JobLocation[] {
  const ids = [
    ...selected.map((entry) => entry.id),
    ...selected
      .filter((entry) => entry.kind === "city" && entry.countryId !== entry.id)
      .map((entry) => entry.countryId),
  ];
  return resolveLocations(ids, MAX_JOB_LOCATIONS + 8);
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
    return POPULAR_IDS.map((id) => BY_ID.get(id))
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
