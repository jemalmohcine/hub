"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  EmptyState,
  Field,
  IconButton,
  Input,
  Select,
  Sheet,
  Stack,
  Text,
  useAsyncAction,
} from "@/design-system";
import {
  applyToJobListing,
  importJobFromUrl,
  saveJobSearchConfig,
} from "@/modules/job-board/actions";
import { applyBoardsForPrefs } from "@/modules/job-board/apply-boards";
import type { CvJobProfile } from "@/modules/job-board/cv-skills";
import type { RankedJobListing } from "@/modules/job-board/fit";
import { rankListingsForPrefs } from "@/modules/job-board/fit";
import {
  EMPLOYMENT_FILTER_LABELS,
  POSTED_WITHIN_LABELS,
  POSTED_WITHIN_OPTIONS,
  SENIORITY_LABELS,
  YEARS_MIN_LABELS,
  YEARS_MIN_OPTIONS,
  yearsMinFromExperience,
  type JobEmploymentFilter,
  type JobSeniorityFilter,
} from "@/modules/job-board/filters";
import { MAX_JOB_LOCATIONS, resolveLocation, suggestLocations } from "@/modules/job-board/locations";
import { MAX_JOB_ROLES, resolveRole, rolesToQuery, suggestRoles } from "@/modules/job-board/roles";
import { ApplyBoardLinks } from "@/modules/job-board/ui/apply-board-links";
import { ChipMultiSelect } from "@/modules/job-board/ui/chip-multi-select";
import { truncateAtWord } from "@/lib/text";
import {
  WORK_MODE_LABELS,
  withJobSearchPrefs,
  type JobListing,
  type JobSearchPrefs,
} from "@/modules/job-board/types";
import { JOB_WORK_MODES, normalizeWorkModes, onsiteOnly } from "@/modules/job-board/work-modes";
import type { CvDocumentSummary } from "@/modules/cv-builder/types";
import type { JobApplication } from "@/modules/job-tracker/types";

const KIND_HINT = {
  city: "Ville",
  country: "Pays",
  region: "Région",
} as const;

const SOURCE_LABEL: Record<string, string> = {
  wttj: "WTTJ",
  rekrute: "Rekrute",
  linkedin: "LinkedIn",
  remotive: "Remotive",
  jobicy: "Jobicy",
  arbeitnow: "Arbeitnow",
  wwr: "WWR",
  himalayas: "Himalayas",
  "indeed-fr": "Indeed",
};

const FIT_COPY = {
  excellent: { label: "Bon match", tone: "success" as const },
  good: { label: "Proche", tone: "brand" as const },
};

function modeTone(mode: RankedJobListing["workMode"]): "info" | "brand" | "neutral" {
  if (mode === "remote") return "info";
  if (mode === "hybrid") return "brand";
  return "neutral";
}

export function JobBoardWorkspace({
  initialLibrary,
  initialPrefs,
  hasSavedSearch,
  cvProfiles,
  cvDocuments,
  trackedListingIds,
  onApplicationCreated,
}: {
  initialLibrary: JobListing[];
  initialPrefs: JobSearchPrefs;
  hasSavedSearch: boolean;
  cvProfiles: CvJobProfile[];
  cvDocuments: CvDocumentSummary[];
  trackedListingIds: string[];
  onApplicationCreated?: (application: JobApplication) => void;
}) {
  const [library, setLibrary] = useState(initialLibrary);
  const [prefs, setPrefs] = useState(() => withJobSearchPrefs(initialPrefs));
  const [savedSearch, setSavedSearch] = useState(hasSavedSearch);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [tracked, setTracked] = useState(() => new Set(trackedListingIds));
  const [followingId, setFollowingId] = useState<string | null>(null);
  const saveAction = useAsyncAction();
  const searchAction = useAsyncAction();
  const importAction = useAsyncAction();
  const followAction = useAsyncAction();
  const searching = searchAction.pending;

  const cvId = prefs.cvDocumentId ?? "";
  const canSave = !onsiteOnly(prefs) || prefs.locations.length > 0;
  const activeCv = useMemo(
    () => cvProfiles.find((profile) => profile.id === cvId) ?? null,
    [cvId, cvProfiles],
  );
  const listings = useMemo(
    () => rankListingsForPrefs(library, prefs, activeCv ?? []),
    [library, prefs, activeCv],
  );

  const summaryChips = useMemo(() => {
    const roles = prefs.roles.map((id) => resolveRole(id).label);
    const places = prefs.locations.map((id) => resolveLocation(id).label);
    const modes = normalizeWorkModes(prefs).map((mode) => WORK_MODE_LABELS[mode]);
    const extra: string[] = [];
    if (prefs.keyword.trim()) extra.push(prefs.keyword.trim());
    if (prefs.yearsMin != null) {
      extra.push(YEARS_MIN_LABELS[prefs.yearsMin as keyof typeof YEARS_MIN_LABELS] ?? `${prefs.yearsMin} ans`);
    }
    if (prefs.seniority !== "any") extra.push(SENIORITY_LABELS[prefs.seniority]);
    if (prefs.postedWithinDays === 7 || prefs.postedWithinDays === 30) {
      extra.push(POSTED_WITHIN_LABELS[prefs.postedWithinDays]);
    }
    if (prefs.employment !== "all") extra.push(EMPLOYMENT_FILTER_LABELS[prefs.employment]);
    return [...roles, ...places, ...modes, ...extra];
  }, [prefs]);

  const hasSearch =
    prefs.roles.length > 0 ||
    prefs.roleQuery.trim().length >= 2 ||
    prefs.keyword.trim().length >= 2;
  const hasFilters =
    hasSearch ||
    prefs.locations.length > 0 ||
    prefs.yearsMin != null ||
    prefs.seniority !== "any" ||
    prefs.postedWithinDays != null ||
    prefs.employment !== "all" ||
    Boolean(prefs.cvDocumentId);
  const boards = useMemo(() => (hasSearch ? applyBoardsForPrefs(prefs) : []), [hasSearch, prefs]);

  function persist(
    next: JobSearchPrefs,
    options: { scrape: boolean; success?: string; silent?: boolean; closeSheet?: boolean },
  ) {
    const runner = options.scrape ? searchAction : saveAction;
    void runner.run(() => saveJobSearchConfig(next, { scrape: options.scrape }), {
      silent: options.silent,
      success: options.success,
      error: (err) =>
        err instanceof Error ? err.message : "Impossible d’enregistrer la recherche",
      onSuccess: (result) => {
        setPrefs(withJobSearchPrefs(result.prefs));
        setSavedSearch(true);
        if (options.scrape) setLibrary(result.library);
        if (options.closeSheet) setSheetOpen(false);
      },
    });
  }

  function handleSaveFilters() {
    if (!canSave) return;
    persist(prefs, {
      scrape: false,
      success: "Filtres enregistrés",
      closeSheet: true,
    });
  }

  function handleSearch() {
    if (!canSave) return;
    persist(prefs, {
      scrape: true,
      success: prefs.cvDocumentId
        ? "Nouvelles offres selon ton CV"
        : "Nouvelles offres trouvées",
      closeSheet: true,
    });
  }

  function handleCvChange(nextId: string) {
    if (!nextId) {
      const next: JobSearchPrefs = { ...prefs, cvDocumentId: null };
      setPrefs(next);
      persist(next, { scrape: false, silent: true });
      return;
    }
    const profile = cvProfiles.find((entry) => entry.id === nextId);
    const next: JobSearchPrefs = {
      ...prefs,
      cvDocumentId: nextId,
      roles: profile?.roles.length ? profile.roles : prefs.roles,
      roleQuery: profile?.roles.length ? rolesToQuery(profile.roles) : prefs.roleQuery,
      locations: profile?.locations.length ? profile.locations : prefs.locations,
      yearsMin:
        profile && profile.years > 0 ? yearsMinFromExperience(profile.years) : prefs.yearsMin,
    };
    setPrefs(next);
    persist(next, { scrape: false, success: "CV ajouté à ta recherche" });
  }

  function handleFollow(listing: RankedJobListing) {
    setFollowingId(listing.id);
    void followAction
      .run(() => applyToJobListing(listing.id, cvId || null), {
        success: "Ajouté au suivi",
        error: "Impossible de suivre cette offre",
        onSuccess: (application) => {
          setTracked((prev) => new Set(prev).add(listing.id));
          onApplicationCreated?.(application);
        },
      })
      .finally(() => setFollowingId(null));
  }

  function openSource(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleImportUrl() {
    const url = importUrl.trim();
    if (!url) return;
    void importAction.run(() => importJobFromUrl(url, cvId || null), {
      success: "Offre ajoutée au suivi",
      error: "Impossible d’importer cette URL",
      onSuccess: (application) => {
        setImportUrl("");
        setSheetOpen(false);
        onApplicationCreated?.(application);
      },
    });
  }

  const modes = normalizeWorkModes(prefs);
  const remoteOnly = modes.length === 1 && modes[0] === "remote";
  const freelanceOnly = prefs.employment === "freelance";
  const trendingOnly = prefs.postedWithinDays === 7;

  function applyQuick(next: JobSearchPrefs) {
    setPrefs(next);
    persist(next, { scrape: false, silent: true });
  }

  return (
    <Stack gap={4} className="pb-8">
      <Cluster gap={2} className="flex-wrap items-center justify-between">
        <Cluster gap={1} className="min-w-0 flex-1 flex-wrap">
          {summaryChips.length > 0 ? (
            summaryChips.map((chip) => (
              <Badge key={chip} tone="neutral">
                {chip}
              </Badge>
            ))
          ) : (
            <Text size="sm" tone="muted">
              Choisis un poste, une ville, des années. Le CV est optionnel.
            </Text>
          )}
        </Cluster>
        <Cluster gap={2} className="flex-wrap items-center">
          {(cvProfiles.length > 0 || cvDocuments.length > 0) ? (
            <Select
              id="offers-cv"
              value={cvId}
              onChange={(e) => handleCvChange(e.target.value)}
              className="h-9 w-[min(100%,16rem)]"
            >
              <option value="">Aucun CV</option>
              {cvProfiles.length > 0
                ? cvProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.title}
                      {profile.years > 0 ? ` · ${Math.round(profile.years)} ans` : ""}
                    </option>
                  ))
                : cvDocuments.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title}
                    </option>
                  ))}
            </Select>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={searching || !canSave}
            onClick={handleSearch}
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {library.length > 0 ? "Nouvelles offres" : "Chercher les offres"}
          </Button>
        </Cluster>
      </Cluster>

      <Cluster gap={1} className="flex-wrap">
        <Button
          type="button"
          size="sm"
          variant={!remoteOnly && !freelanceOnly && !trendingOnly ? "primary" : "outline"}
          onClick={() =>
            applyQuick({
              ...prefs,
              workModes: [...JOB_WORK_MODES],
              workMode: "hybrid",
              employment: "all",
              postedWithinDays: null,
            })
          }
        >
          Tous
        </Button>
        <Button
          type="button"
          size="sm"
          variant={remoteOnly ? "primary" : "outline"}
          onClick={() =>
            applyQuick({
              ...prefs,
              workModes: remoteOnly ? [...JOB_WORK_MODES] : ["remote"],
              workMode: remoteOnly ? "hybrid" : "remote",
            })
          }
        >
          Télétravail
        </Button>
        <Button
          type="button"
          size="sm"
          variant={freelanceOnly ? "primary" : "outline"}
          onClick={() =>
            applyQuick({
              ...prefs,
              employment: freelanceOnly ? "all" : "freelance",
            })
          }
        >
          Freelance
        </Button>
        <Button
          type="button"
          size="sm"
          variant={trendingOnly ? "primary" : "outline"}
          onClick={() =>
            applyQuick({
              ...prefs,
              postedWithinDays: trendingOnly ? null : 7,
            })
          }
        >
          Tendance
        </Button>
      </Cluster>

      {activeCv && (activeCv.years > 0 || activeCv.skills.length > 0) ? (
        <Text size="sm" tone="muted">
          Selon ce CV
          {activeCv.years > 0 ? ` · ${Math.round(activeCv.years)} ans` : ""}
          {activeCv.skills.length > 0
            ? ` · ${truncateAtWord(activeCv.skills.join(", "), 120)}`
            : ""}
        </Text>
      ) : null}

      {searching ? (
        <Text size="sm" tone="muted">
          On cherche de nouvelles offres
          {activeCv ? " selon ton CV" : " avec ta recherche"}…
        </Text>
      ) : library.length > 0 ? (
        <Text size="sm" tone="muted">
          Tes offres sont enregistrées. Les filtres s’appliquent tout de suite.
        </Text>
      ) : null}

      {boards.length > 0 && listings.length > 0 ? (
        <Stack gap={2}>
          <Text size="sm" weight="medium">
            Postuler sur
          </Text>
          <ApplyBoardLinks boards={boards} />
          <Text size="sm" tone="muted">
            La recherche s’ouvre déjà remplie. Tu postules sur le site, puis tu suis ici.
          </Text>
        </Stack>
      ) : null}

      {listings.length > 0 ? (
        <Text size="sm" tone="muted">
          {listings.length} offre{listings.length !== 1 ? "s" : ""}
          {activeCv ? " · les plus proches de ton CV" : " · selon tes filtres"}
          {library.length > listings.length ? ` (${library.length} enregistrées)` : ""}
        </Text>
      ) : null}

      <Stack gap={2}>
        {listings.map((listing) => {
          const isTracked = tracked.has(listing.id);
          const followingThis = followAction.pending && followingId === listing.id;
          const fit = listing.fitLabel === "ok" ? null : FIT_COPY[listing.fitLabel];
          return (
            <Card key={listing.id} className="p-4">
              <Stack gap={2}>
                <Cluster gap={2} className="flex-wrap items-start justify-between">
                  <div className="min-w-0">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => openSource(listing.url)}
                    >
                      <Text as="span" weight="medium" className="leading-snug underline-offset-2 hover:underline">
                        {listing.title}
                      </Text>
                    </button>
                    <Cluster gap={1} className="mt-0.5 flex-wrap">
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <Text size="sm" tone="muted">
                        {listing.company}
                        {listing.location ? ` · ${listing.location}` : ""}
                      </Text>
                    </Cluster>
                  </div>
                  <Cluster gap={1} className="flex-wrap">
                    {listing.trending ? <Badge tone="warning">Tendance</Badge> : null}
                    {fit ? <Badge tone={fit.tone}>{fit.label}</Badge> : null}
                    {SOURCE_LABEL[listing.source] ? (
                      <Badge tone="neutral">{SOURCE_LABEL[listing.source]}</Badge>
                    ) : null}
                    {listing.workMode ? (
                      <Badge tone={modeTone(listing.workMode)}>
                        {WORK_MODE_LABELS[listing.workMode]}
                      </Badge>
                    ) : null}
                  </Cluster>
                </Cluster>

                {listing.salaryHint ? (
                  <Text size="sm" tone="muted">
                    {listing.salaryHint}
                  </Text>
                ) : null}

                <Cluster gap={2} className="flex-wrap">
                  <Button asChild size="sm">
                    <a href={listing.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Postuler
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={followingThis || isTracked}
                    onClick={() => handleFollow(listing)}
                  >
                    {followingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {isTracked ? "Déjà suivi" : "Suivre"}
                  </Button>
                </Cluster>
              </Stack>
            </Card>
          );
        })}

        {listings.length === 0 ? (
          <EmptyState
            icon={savedSearch && hasFilters ? MapPin : Briefcase}
            title={
              searching
                ? "On cherche les offres"
                : !savedSearch
                  ? "Ta recherche"
                  : library.length > 0
                    ? "Rien ne correspond dans tes offres"
                    : "Pas encore d’offres"
            }
            hint={
              searching
                ? "On parcourt les sites d’emploi avec ta recherche" +
                  (activeCv ? " et ton CV." : ".")
                : !savedSearch
                  ? "Poste, ville, éventuellement un CV : enregistre ta recherche, puis cherche les offres. Ensuite tu filtres sans tout relancer."
                  : library.length > 0
                    ? "Élargis les filtres, ou cherche de nouvelles offres."
                    : "Tes filtres sont prêts. Cherche les offres — elles resteront ici pour filtrer."
            }
            action={
              searching ? undefined : (
                <Stack gap={3} className="items-center">
                  {boards.length > 0 ? <ApplyBoardLinks boards={boards} /> : null}
                  {savedSearch ? (
                    <Button type="button" size="sm" disabled={!canSave} onClick={handleSearch}>
                      {library.length > 0 ? "Chercher de nouvelles offres" : "Chercher les offres"}
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
                      Choisir
                    </Button>
                  )}
                </Stack>
              )
            }
          />
        ) : null}
      </Stack>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        desktop="full"
        title="Ta recherche"
        description="Les filtres s’appliquent à tes offres déjà enregistrées. « Nouvelles offres » relance la recherche sur les sites. Le CV, si tu en choisis un, fait partie de ta recherche."
        headerActions={
          <IconButton label="Fermer" size="sm" onClick={() => setSheetOpen(false)}>
            <X className="h-4 w-4" />
          </IconButton>
        }
      >
        <Stack gap={3}>
          <Field
            label="Type de poste"
            htmlFor="job-roles"
            hint="Liste prédéfinie, ou tape pour ajouter le tien."
          >
            <ChipMultiSelect
              id="job-roles"
              value={prefs.roles}
              max={MAX_JOB_ROLES}
              placeholder="Cherche frontend, tech lead, data…"
              resolveLabel={(id) => resolveRole(id).label}
              suggest={(query, selected) =>
                suggestRoles(query, selected).map((role) => ({
                  id: role.id,
                  label: role.label,
                }))
              }
              onChange={(roles) =>
                setPrefs({ ...prefs, roles, roleQuery: rolesToQuery(roles) })
              }
            />
          </Field>
          <Field
            label="Villes ou pays"
            htmlFor="job-locations"
            hint="Tous les pays, les grandes villes, ou ajoute le tien."
          >
            <ChipMultiSelect
              id="job-locations"
              value={prefs.locations}
              max={MAX_JOB_LOCATIONS}
              placeholder="Cherche Casablanca, Maroc, Paris…"
              resolveLabel={(id) => resolveLocation(id).label}
              suggest={(query, selected) =>
                suggestLocations(query, selected).map((entry) => ({
                  id: entry.id,
                  label: entry.label,
                  hint: KIND_HINT[entry.kind],
                }))
              }
              onChange={(locations) => setPrefs({ ...prefs, locations })}
            />
          </Field>
          <div>
            <Text size="sm" weight="medium" className="mb-2">
              Mode de travail
            </Text>
            <Cluster gap={2} className="flex-wrap">
              {JOB_WORK_MODES.map((mode) => {
                const selected = normalizeWorkModes(prefs).includes(mode);
                return (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={selected ? "primary" : "outline"}
                    onClick={() => {
                      const current = normalizeWorkModes(prefs);
                      const next = current.includes(mode)
                        ? current.filter((entry) => entry !== mode)
                        : [...current, mode];
                      if (next.length === 0) return;
                      setPrefs({
                        ...prefs,
                        workModes: next,
                        workMode: next[0] ?? "hybrid",
                      });
                    }}
                  >
                    {WORK_MODE_LABELS[mode]}
                  </Button>
                );
              })}
            </Cluster>
          </div>
          <Field
            label="Mots du titre"
            htmlFor="job-keyword"
            hint="Pour coller exactement : React, Python, Rust…"
          >
            <Input
              id="job-keyword"
              value={prefs.keyword}
              onChange={(e) => setPrefs({ ...prefs, keyword: e.target.value })}
              placeholder="ex. React Native"
            />
          </Field>
          <Field label="Années d’expérience" htmlFor="job-years">
            <Select
              id="job-years"
              value={prefs.yearsMin == null ? "" : String(prefs.yearsMin)}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  yearsMin: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            >
              <option value="">Peu importe</option>
              {YEARS_MIN_OPTIONS.map((years) => (
                <option key={years} value={years}>
                  {YEARS_MIN_LABELS[years]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Niveau" htmlFor="job-seniority">
            <Select
              id="job-seniority"
              value={prefs.seniority}
              onChange={(e) =>
                setPrefs({ ...prefs, seniority: e.target.value as JobSeniorityFilter })
              }
            >
              {(Object.keys(SENIORITY_LABELS) as JobSeniorityFilter[]).map((key) => (
                <option key={key} value={key}>
                  {SENIORITY_LABELS[key]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Publiée depuis" htmlFor="job-posted">
            <Select
              id="job-posted"
              value={prefs.postedWithinDays == null ? "" : String(prefs.postedWithinDays)}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  postedWithinDays: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            >
              <option value="">Toutes dates</option>
              {POSTED_WITHIN_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {POSTED_WITHIN_LABELS[days]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contrat" htmlFor="job-employment">
            <Select
              id="job-employment"
              value={prefs.employment}
              onChange={(e) =>
                setPrefs({ ...prefs, employment: e.target.value as JobEmploymentFilter })
              }
            >
              {(Object.keys(EMPLOYMENT_FILTER_LABELS) as JobEmploymentFilter[]).map((key) => (
                <option key={key} value={key}>
                  {EMPLOYMENT_FILTER_LABELS[key]}
                </option>
              ))}
            </Select>
          </Field>
          {cvDocuments.length > 0 || cvProfiles.length > 0 ? (
            <Field
              label="CV pour matcher les offres"
              htmlFor="board-cv"
              hint="Optionnel. S’il est choisi, il entre dans ta recherche (poste, ville, compétences). « Aucun CV » retire seulement ce filtre."
            >
              <Select
                id="board-cv"
                value={cvId}
                onChange={(e) => handleCvChange(e.target.value)}
              >
                <option value="">Aucun CV</option>
                {cvProfiles.length > 0
                  ? cvProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.title}
                        {profile.years > 0 ? ` · ${Math.round(profile.years)} ans` : ""}
                      </option>
                    ))
                  : cvDocuments.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.title}
                      </option>
                    ))}
              </Select>
            </Field>
          ) : null}
          <Cluster gap={2} className="flex-wrap">
            {library.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                disabled={saveAction.pending || !canSave}
                onClick={handleSaveFilters}
              >
                {saveAction.pending && !searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Enregistrer les filtres
              </Button>
            ) : null}
            <Button type="button" disabled={searching || !canSave} onClick={handleSearch}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {library.length > 0 ? "Chercher de nouvelles offres" : "Chercher les offres"}
            </Button>
          </Cluster>
          {boards.length > 0 ? (
            <Stack gap={2}>
              <Text size="sm" weight="medium">
                Ou postuler maintenant
              </Text>
              <ApplyBoardLinks boards={boards} />
            </Stack>
          ) : null}

          <Field label="J’ai déjà un lien" htmlFor="job-import-url">
            <Cluster gap={2} className="flex-col sm:flex-row">
              <Input
                id="job-import-url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1"
              />
              <Button
                type="button"
                disabled={importAction.pending || !importUrl.trim()}
                onClick={handleImportUrl}
              >
                {importAction.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Suivre
              </Button>
            </Cluster>
          </Field>
        </Stack>
      </Sheet>
    </Stack>
  );
}
