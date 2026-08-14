"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
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
  searchJobsForMe,
} from "@/modules/job-board/actions";
import {
  WORK_MODE_LABELS,
  type JobListing,
  type JobSearchPrefs,
  type JobWorkMode,
} from "@/modules/job-board/types";
import type { CvDocumentSummary } from "@/modules/cv-builder/types";
import type { JobApplication } from "@/modules/job-tracker/types";

const MODES: JobWorkMode[] = ["remote", "hybrid", "onsite"];

function modeTone(mode: JobListing["workMode"]): "info" | "brand" | "neutral" {
  if (mode === "remote") return "info";
  if (mode === "hybrid") return "brand";
  return "neutral";
}

export function JobBoardWorkspace({
  initialListings,
  initialPrefs,
  cvDocuments,
  trackedListingIds,
  onApplicationCreated,
}: {
  initialListings: JobListing[];
  initialPrefs: JobSearchPrefs;
  cvDocuments: CvDocumentSummary[];
  trackedListingIds: string[];
  onApplicationCreated?: (application: JobApplication) => void;
}) {
  const [listings, setListings] = useState(initialListings);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [cvId, setCvId] = useState(cvDocuments[0]?.id ?? "");
  const [importUrl, setImportUrl] = useState("");
  const [tracked, setTracked] = useState(() => new Set(trackedListingIds));
  const { run, pending } = useAsyncAction();

  const canSearch =
    prefs.roleQuery.trim().length >= 2 &&
    (prefs.workMode !== "onsite" || prefs.city.trim().length > 0);

  const sorted = useMemo(() => listings, [listings]);

  function handleSearch() {
    if (!canSearch) return;
    void run(() => searchJobsForMe(prefs), {
      success: (result) =>
        result.listings.length === 1
          ? "1 offre trouvée"
          : `${result.listings.length} offres trouvées`,
      error: "Impossible de chercher les offres",
      onSuccess: (result) => {
        setPrefs(result.prefs);
        setListings(result.listings);
      },
    });
  }

  function handleFollow(listing: JobListing, openOffer: boolean) {
    void run(() => applyToJobListing(listing.id, cvId || null), {
      success: openOffer ? "Suivi — ouverture de l’offre" : "Ajouté au suivi",
      error: "Impossible de suivre cette offre",
      onSuccess: (application) => {
        setTracked((prev) => new Set(prev).add(listing.id));
        onApplicationCreated?.(application);
        if (openOffer) {
          window.open(listing.url, "_blank", "noopener,noreferrer");
        }
      },
    });
  }

  function handleImportUrl() {
    const url = importUrl.trim();
    if (!url) return;
    void run(() => importJobFromUrl(url, cvId || null), {
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
            <Text weight="medium">Ce que tu cherches</Text>
            <Text size="sm" tone="muted" className="mt-1">
              Poste, ville, télétravail ou présentiel. On scrape des sources FR
              (pas le mondial) et on te ramène les offres.
            </Text>
          </div>
          <Field label="Type de poste" htmlFor="job-role-query">
            <Input
              id="job-role-query"
              value={prefs.roleQuery}
              onChange={(e) => setPrefs({ ...prefs, roleQuery: e.target.value })}
              placeholder="Ex. développeur React, data engineer…"
            />
          </Field>
          <Field
            label="Ville"
            htmlFor="job-city"
            hint={
              prefs.workMode === "remote"
                ? "Optionnel en télétravail (France)."
                : "Ex. Paris, Lyon, Nantes…"
            }
          >
            <Input
              id="job-city"
              value={prefs.city}
              onChange={(e) => setPrefs({ ...prefs, city: e.target.value })}
              placeholder={prefs.workMode === "remote" ? "France" : "Paris"}
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
            disabled={pending || !canSearch}
            onClick={handleSearch}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Trouver des offres
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
              disabled={pending || !importUrl.trim()}
              onClick={handleImportUrl}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Suivre
            </Button>
          </Cluster>
        </Stack>
      </Card>

      <Text size="sm" tone="muted">
        {sorted.length} offre{sorted.length !== 1 ? "s" : ""}
      </Text>

      <Stack gap={2}>
        {sorted.map((listing) => {
          const isTracked = tracked.has(listing.id);
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
                    disabled={pending}
                    onClick={() => handleFollow(listing, true)}
                  >
                    {pending ? (
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
                    disabled={pending || isTracked}
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
            title="Aucune offre pour l’instant"
            hint="Remplis le poste, la ville et le mode, puis lance la recherche."
          />
        ) : null}
      </Stack>
    </Stack>
  );
}
