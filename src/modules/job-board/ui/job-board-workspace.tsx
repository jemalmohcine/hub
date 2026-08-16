"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
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
import type { RankedJobListing } from "@/modules/job-board/fit";
import { MAX_JOB_LOCATIONS, resolveLocation, suggestLocations } from "@/modules/job-board/locations";
import { MAX_JOB_ROLES, resolveRole, rolesToQuery, suggestRoles } from "@/modules/job-board/roles";
import { ApplyBoardLinks } from "@/modules/job-board/ui/apply-board-links";
import { ChipMultiSelect } from "@/modules/job-board/ui/chip-multi-select";
import {
  WORK_MODE_LABELS,
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
  remotive: "Remotive",
  jobicy: "Jobicy",
  arbeitnow: "Arbeitnow",
  wwr: "WWR",
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
  initialListings,
  initialPrefs,
  cvHint,
  cvSkills,
  cvDocuments,
  trackedListingIds,
  onApplicationCreated,
}: {
  initialListings: RankedJobListing[];
  initialPrefs: JobSearchPrefs;
  cvHint: { roles: string[]; locations: string[] };
  cvSkills: string[];
  cvDocuments: CvDocumentSummary[];
  trackedListingIds: string[];
  onApplicationCreated?: (application: JobApplication) => void;
}) {
  const [listings, setListings] = useState(initialListings);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cvId, setCvId] = useState(cvDocuments[0]?.id ?? "");
  const [importUrl, setImportUrl] = useState("");
  const [tracked, setTracked] = useState(() => new Set(trackedListingIds));
  const [followingId, setFollowingId] = useState<string | null>(null);
  const autoSaved = useRef(false);
  const saveAction = useAsyncAction();
  const importAction = useAsyncAction();
  const followAction = useAsyncAction();

  const canSave =
    (prefs.roles.length > 0 || prefs.roleQuery.trim().length >= 2) &&
    (!onsiteOnly(prefs) || prefs.locations.length > 0);

  const summaryChips = useMemo(() => {
    const roles = prefs.roles.map((id) => resolveRole(id).label);
    const places = prefs.locations.map((id) => resolveLocation(id).label);
    const modes = normalizeWorkModes(prefs).map((mode) => WORK_MODE_LABELS[mode]);
    return [...roles, ...places, ...modes];
  }, [prefs]);

  const hasSearch = prefs.roles.length > 0 || prefs.roleQuery.trim().length >= 2;
  const boards = useMemo(() => (hasSearch ? applyBoardsForPrefs(prefs) : []), [hasSearch, prefs]);

  function persist(next: JobSearchPrefs, success: string) {
    void saveAction.run(() => saveJobSearchConfig(next, cvSkills), {
      success,
      error: (err) =>
        err instanceof Error ? err.message : "Impossible d’enregistrer la recherche",
      onSuccess: (result) => {
        setPrefs(result.prefs);
        setListings(result.listings);
        setSheetOpen(false);
      },
    });
  }

  useEffect(() => {
    if (autoSaved.current) return;
    const roles = prefs.roles.length > 0 ? prefs.roles : cvHint.roles;
    const locations = prefs.locations.length > 0 ? prefs.locations : cvHint.locations;
    if (roles.length === 0 && locations.length === 0) return;
    if (roles === prefs.roles && locations === prefs.locations) return;
    autoSaved.current = true;
    const next: JobSearchPrefs = {
      ...prefs,
      roles,
      locations,
      roleQuery: rolesToQuery(roles) || prefs.roleQuery,
    };
    setPrefs(next);
    persist(next, "Recherche reprise depuis ton CV");
    // First paint only — prefs/cvHint are the server snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSave() {
    if (!canSave) return;
    persist(prefs, "Offres ciblées mises à jour");
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
              Choisis un poste et une ville
            </Text>
          )}
        </Cluster>
        <Button type="button" size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
          <Pencil className="h-4 w-4" />
          Modifier
        </Button>
      </Cluster>

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
          {listings.length} offre{listings.length !== 1 ? "s" : ""} scrapée
          {listings.length !== 1 ? "s" : ""} · WTTJ d’abord, les plus proches de toi en tête
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
            icon={hasSearch ? MapPin : Briefcase}
            title={hasSearch ? "Rien d’assez proche pour l’instant" : "Dis-nous ce que tu cherches"}
            hint={
              hasSearch
                ? "Rien d’assez proche dans le scrape. Relance Voir les offres, ou postule sur LinkedIn / Indeed."
                : "Un poste et une ville. On scrape WTTJ, Remotive et Jobicy tout de suite."
            }
            action={
              <Stack gap={3} className="items-center">
                {boards.length > 0 ? <ApplyBoardLinks boards={boards} /> : null}
                <Button type="button" size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
                  {hasSearch ? "Ajuster" : "Choisir"}
                </Button>
              </Stack>
            }
          />
        ) : null}
      </Stack>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        desktop="full"
        title="Ta recherche"
        description="Poste, villes, mode. On scrape WTTJ et les boards publics à l’enregistrement."
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
          {cvDocuments.length > 0 ? (
            <Field label="CV à lier au suivi" htmlFor="board-cv">
              <Select
                id="board-cv"
                value={cvId}
                onChange={(e) => setCvId(e.target.value)}
              >
                <option value="">Aucun CV lié</option>
                {cvDocuments.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.title}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Button type="button" disabled={saveAction.pending || !canSave} onClick={handleSave}>
            {saveAction.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Voir les offres
          </Button>
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
