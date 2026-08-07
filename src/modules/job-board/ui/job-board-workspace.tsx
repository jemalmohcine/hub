"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Sparkles,
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
} from "@/modules/job-board/actions";
import {
  EMPLOYMENT_CATEGORY_LABELS,
  JOB_LISTING_FILTER_LABELS,
  type JobListing,
  type JobListingFilter,
} from "@/modules/job-board/types";
import type { CvDocumentSummary } from "@/modules/cv-builder/types";
import type { JobApplication } from "@/modules/job-tracker/types";
import { cn } from "@/lib/utils";

const FILTERS: JobListingFilter[] = [
  "all",
  "salaried",
  "freelance_part_time",
  "freelance_full_time",
];

function categoryLabel(listing: JobListing): string {
  if (listing.employmentCategory === "salaried") {
    return EMPLOYMENT_CATEGORY_LABELS.salaried;
  }
  if (listing.freelanceSubtype === "part_time") {
    return JOB_LISTING_FILTER_LABELS.freelance_part_time;
  }
  return JOB_LISTING_FILTER_LABELS.freelance_full_time;
}

function categoryTone(listing: JobListing): "brand" | "warning" | "info" {
  if (listing.employmentCategory === "salaried") return "info";
  if (listing.freelanceSubtype === "part_time") return "warning";
  return "brand";
}

export function JobBoardWorkspace({
  initialListings,
  cvDocuments,
  trackedListingIds,
  onApplicationCreated,
}: {
  initialListings: JobListing[];
  cvDocuments: CvDocumentSummary[];
  trackedListingIds: string[];
  onApplicationCreated?: (application: JobApplication) => void;
}) {
  const [listings] = useState(initialListings);
  const [filter, setFilter] = useState<JobListingFilter>("all");
  const [query, setQuery] = useState("");
  const [cvId, setCvId] = useState(cvDocuments[0]?.id ?? "");
  const [importUrl, setImportUrl] = useState("");
  const [tracked, setTracked] = useState(() => new Set(trackedListingIds));
  const { run, pending } = useAsyncAction();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (filter === "salaried" && listing.employmentCategory !== "salaried") {
        return false;
      }
      if (
        filter === "freelance_part_time" &&
        !(
          listing.employmentCategory === "freelance" &&
          listing.freelanceSubtype === "part_time"
        )
      ) {
        return false;
      }
      if (
        filter === "freelance_full_time" &&
        !(
          listing.employmentCategory === "freelance" &&
          listing.freelanceSubtype === "full_time"
        )
      ) {
        return false;
      }
      if (!q) return true;
      const blob = `${listing.title} ${listing.company} ${listing.description ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [listings, filter, query]);

  function handleApply(listing: JobListing) {
    void run(() => applyToJobListing(listing.id, cvId || null), {
      success: "Ajouté à vos candidatures",
      error: "Impossible de suivre cette offre",
      onSuccess: (application) => {
        setTracked((prev) => new Set(prev).add(listing.id));
        onApplicationCreated?.(application);
        window.open(listing.url, "_blank", "noopener,noreferrer");
      },
    });
  }

  function handleImportUrl() {
    const url = importUrl.trim();
    if (!url) return;
    void run(() => importJobFromUrl(url, cvId || null), {
      success: "Offre importée dans vos candidatures",
      error: "Impossible d’importer cette URL",
      onSuccess: (application) => {
        setImportUrl("");
        onApplicationCreated?.(application);
        if (application.jobUrl) {
          window.open(application.jobUrl, "_blank", "noopener,noreferrer");
        }
      },
    });
  }

  return (
    <Stack gap={4} className="pb-8">
      <Card className="p-4">
        <Stack gap={3}>
          <Cluster gap={2}>
            <Sparkles className="h-4 w-4 text-[var(--dh-brand)]" />
            <Text weight="medium">Offres scrappées pour devs</Text>
          </Cluster>
          <Text size="sm" tone="muted">
            Postule depuis l’app : l’offre est ajoutée à ton suivi de candidatures
            avec la catégorie (salariat ou freelance).
          </Text>
          <Field label="CV pour la candidature" htmlFor="board-cv">
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
        </Stack>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              filter === id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
            )}
          >
            {JOB_LISTING_FILTER_LABELS[id]}
          </button>
        ))}
      </div>

      <Field label="Rechercher" htmlFor="board-search">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="board-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="React, remote, freelance…"
            className="pl-9"
          />
        </div>
      </Field>

      <Card className="p-4">
        <Stack gap={2}>
          <Text size="sm" weight="medium">
            Importer une offre par URL
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
              Importer
            </Button>
          </Cluster>
        </Stack>
      </Card>

      <Text size="sm" tone="muted">
        {filtered.length} offre{filtered.length !== 1 ? "s" : ""}
      </Text>

      <Stack gap={2}>
        {filtered.map((listing) => {
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
                  <Badge tone={categoryTone(listing)}>{categoryLabel(listing)}</Badge>
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
                    onClick={() => handleApply(listing)}
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    {isTracked ? "Ouvrir l’offre" : "Postuler & suivre"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(listing.url, "_blank", "noopener,noreferrer")
                    }
                  >
                    Voir
                  </Button>
                </Cluster>
              </Stack>
            </Card>
          );
        })}

        {filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Aucune offre pour ce filtre"
            hint="Le scrape quotidien alimentera cette liste."
          />
        ) : null}
      </Stack>
    </Stack>
  );
}
