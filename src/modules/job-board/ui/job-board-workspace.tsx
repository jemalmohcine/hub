"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  ExternalLink,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  EmptyState,
  Field,
  Input,
  Select,
  Stack,
  Text,
  useAsyncAction,
} from "@/design-system";
import {
  applyToJobListing,
  importJobFromUrl,
  saveJobSearchConfig,
} from "@/modules/job-board/actions";
import { MAX_JOB_LOCATIONS, resolveLocation, suggestLocations } from "@/modules/job-board/locations";
import { MAX_JOB_ROLES, resolveRole, rolesToQuery, suggestRoles } from "@/modules/job-board/roles";
import { ChipMultiSelect } from "@/modules/job-board/ui/chip-multi-select";
import {
  WORK_MODE_LABELS,
  type JobListing,
  type JobSearchPrefs,
  type JobWorkMode,
} from "@/modules/job-board/types";
import type { CvDocumentSummary } from "@/modules/cv-builder/types";
import type { JobApplication } from "@/modules/job-tracker/types";

const MODES: JobWorkMode[] = ["remote", "hybrid", "onsite"];

const KIND_HINT = {
  city: "Ville",
  country: "Pays",
  region: "Région",
} as const;

function modeTone(mode: JobListing["workMode"]): "info" | "brand" | "neutral" {
  if (mode === "remote") return "info";
  if (mode === "hybrid") return "brand";
  return "neutral";
}

export function JobBoardWorkspace({
  initialListings,
  initialPrefs,
  cvHint,
  cvDocuments,
  trackedListingIds,
  onApplicationCreated,
}: {
  initialListings: JobListing[];
  initialPrefs: JobSearchPrefs;
  cvHint: { roles: string[]; locations: string[] };
  cvDocuments: CvDocumentSummary[];
  trackedListingIds: string[];
  onApplicationCreated?: (application: JobApplication) => void;
}) {
  const [listings, setListings] = useState(initialListings);
  const [prefs, setPrefs] = useState(initialPrefs);
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
    (prefs.workMode !== "onsite" || prefs.locations.length > 0);

  const sorted = useMemo(() => listings, [listings]);

  function persist(next: JobSearchPrefs, success: string) {
    void saveAction.run(() => saveJobSearchConfig(next), {
      success,
      error: (err) =>
        err instanceof Error ? err.message : "Impossible d’enregistrer la recherche",
      onSuccess: (result) => {
        setPrefs(result.prefs);
        setListings(result.listings);
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
    persist(next, "Config reprise depuis ton CV");
    // First paint only — prefs/cvHint are the server snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSave() {
    if (!canSave) return;
    persist(prefs, "Config enregistrée — scrape chaque matin");
  }

  function handleFollow(listing: JobListing, openOffer: boolean) {
    setFollowingId(listing.id);
    void followAction
      .run(() => applyToJobListing(listing.id, cvId || null), {
        success: openOffer ? "Suivi — ouverture de l’offre" : "Ajouté au suivi",
        error: "Impossible de suivre cette offre",
        onSuccess: (application) => {
          setTracked((prev) => new Set(prev).add(listing.id));
          onApplicationCreated?.(application);
          if (openOffer) {
            window.open(listing.url, "_blank", "noopener,noreferrer");
          }
        },
      })
      .finally(() => setFollowingId(null));
  }

  function handleImportUrl() {
    const url = importUrl.trim();
    if (!url) return;
    void importAction.run(() => importJobFromUrl(url, cvId || null), {
      success: "Offre ajoutée au suivi",
      error: "Impossible d’importer cette URL",
      onSuccess: (application) => {
        setImportUrl("");
        onApplicationCreated?.(application);
      },
    });
  }

  return (
    <Stack gap={4} className="pb-8">
      <Card className="p-4">
        <Stack gap={3}>
          <div>
            <Text weight="medium">Ta recherche</Text>
            <Text size="sm" tone="muted" className="mt-1">
              Postes, villes ou pays : multi-choix. Si tu as un CV, on préremplit
              et on enregistre tout seul. Le scrape tourne chaque matin.
            </Text>
          </div>
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
              Mode
            </Text>
            <Cluster gap={2} className="flex-wrap">
              {MODES.map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  size="sm"
                  variant={prefs.workMode === mode ? "primary" : "outline"}
                  onClick={() => setPrefs({ ...prefs, workMode: mode })}
                >
                  {WORK_MODE_LABELS[mode]}
                </Button>
              ))}
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
          <Button
            type="button"
            disabled={saveAction.pending || !canSave}
            onClick={handleSave}
          >
            {saveAction.pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Enregistrer la config
          </Button>
        </Stack>
      </Card>

      <Card className="p-4">
        <Stack gap={2}>
          <Text size="sm" weight="medium">
            J’ai déjà un lien
          </Text>
          <Cluster gap={2} className="flex-col sm:flex-row">
            <Input
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
              {importAction.pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Suivre
            </Button>
          </Cluster>
        </Stack>
      </Card>

      <Text size="sm" tone="muted">
        {sorted.length} offre{sorted.length !== 1 ? "s" : ""} · scrape du matin
      </Text>

      <Stack gap={2}>
        {sorted.map((listing) => {
          const isTracked = tracked.has(listing.id);
          const followingThis = followAction.pending && followingId === listing.id;
          return (
            <Card key={listing.id} className="p-4">
              <Stack gap={2}>
                <Cluster gap={2} className="flex-wrap items-start justify-between">
                  <div className="min-w-0">
                    <Text weight="medium" className="leading-snug">
                      {listing.title}
                    </Text>
                    <Cluster gap={1}>
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <Text size="sm" tone="muted">
                        {listing.company}
                      </Text>
                    </Cluster>
                  </div>
                  <Cluster gap={1} className="flex-wrap">
                    {listing.workMode ? (
                      <Badge tone={modeTone(listing.workMode)}>
                        {WORK_MODE_LABELS[listing.workMode]}
                      </Badge>
                    ) : null}
                  </Cluster>
                </Cluster>

                {listing.location ? (
                  <Cluster gap={1}>
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <Text size="sm" tone="muted">
                      {listing.location}
                    </Text>
                  </Cluster>
                ) : null}

                {listing.salaryHint ? (
                  <Text size="sm" tone="muted">
                    {listing.salaryHint}
                  </Text>
                ) : null}

                {listing.description ? (
                  <Text size="sm" tone="muted" className="line-clamp-3">
                    {listing.description.replace(/<[^>]+>/g, " ")}
                  </Text>
                ) : null}

                <Cluster gap={2} className="flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    disabled={followingThis}
                    onClick={() => handleFollow(listing, true)}
                  >
                    {followingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    {isTracked ? "Ouvrir" : "Postuler"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={followingThis || isTracked}
                    onClick={() => handleFollow(listing, false)}
                  >
                    {isTracked ? "Déjà suivi" : "Suivre"}
                  </Button>
                </Cluster>
              </Stack>
            </Card>
          );
        })}

        {sorted.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Les offres arrivent chaque matin"
            hint="Ta config (poste + lieux) suffit. Tu peux aussi coller un lien tout de suite."
          />
        ) : null}
      </Stack>
    </Stack>
  );
}
