"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Briefcase, FileText, Search } from "lucide-react";
import { Stack } from "@/design-system";
import type { CvDocument, CvDocumentSummary } from "@/modules/cv-builder/types";
import { CvBuilderWorkspace } from "@/modules/cv-builder/ui/cv-builder-workspace";
import type { RankedJobListing } from "@/modules/job-board/fit";
import { JobBoardWorkspace } from "@/modules/job-board/ui/job-board-workspace";
import type { CvJobProfile } from "@/modules/job-board/cv-skills";
import type { JobSearchPrefs } from "@/modules/job-board/types";
import type { JobApplication } from "@/modules/job-tracker/types";
import { JobTrackerWorkspace } from "@/modules/job-tracker/ui/job-tracker-workspace";
import { cn } from "@/lib/utils";

export type CareerTab = "cv" | "offers" | "jobs";

const TABS: Array<{ id: CareerTab; label: string; icon: typeof FileText }> = [
  { id: "cv", label: "CV Builder", icon: FileText },
  { id: "offers", label: "Offres", icon: Search },
  { id: "jobs", label: "Candidatures", icon: Briefcase },
];

function tabFromParams(params: URLSearchParams, fallback: CareerTab): CareerTab {
  const param = params.get("tab");
  if (param === "jobs" || param === "offers" || param === "cv") return param;
  return fallback;
}

export function CareerWorkspace({
  initialTab,
  cvEntitled,
  jobsEntitled,
  initialDoc,
  initialDocuments,
  initialJobs,
  initialListings,
  initialPrefs,
  hasSavedSearch,
  cvProfiles,
}: {
  initialTab: CareerTab;
  cvEntitled: boolean;
  jobsEntitled: boolean;
  initialDoc: CvDocument;
  initialDocuments: CvDocumentSummary[];
  initialJobs: JobApplication[];
  initialListings: RankedJobListing[];
  initialPrefs: JobSearchPrefs;
  hasSavedSearch: boolean;
  cvProfiles: CvJobProfile[];
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<CareerTab>(() =>
    tabFromParams(searchParams, initialTab),
  );
  const [jobs, setJobs] = useState(initialJobs);

  useEffect(() => {
    setActiveTab(tabFromParams(searchParams, initialTab));
  }, [searchParams, initialTab]);

  function setTab(tab: CareerTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    const url = `/app/career?tab=${tab}`;
    window.history.replaceState(window.history.state, "", url);
  }

  const trackedListingIds = jobs
    .map((j) => j.listingId)
    .filter((id): id is string => Boolean(id));

  return (
    <Stack gap={4}>
      <div className="flex gap-1 rounded-2xl bg-muted/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const disabled =
            (tab.id === "cv" && !cvEntitled) ||
            ((tab.id === "jobs" || tab.id === "offers") && !jobsEntitled);
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => setTab(tab.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-medium transition-colors sm:px-3",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {cvEntitled ? (
        <div className={activeTab === "cv" ? undefined : "hidden"} aria-hidden={activeTab !== "cv"}>
          <CvBuilderWorkspace initialDoc={initialDoc} initialDocuments={initialDocuments} />
        </div>
      ) : null}

      {jobsEntitled ? (
        <div
          className={activeTab === "offers" ? undefined : "hidden"}
          aria-hidden={activeTab !== "offers"}
        >
          <JobBoardWorkspace
            initialListings={initialListings}
            initialPrefs={initialPrefs}
            hasSavedSearch={hasSavedSearch}
            offersActive={activeTab === "offers"}
            cvProfiles={cvProfiles}
            cvDocuments={initialDocuments}
            trackedListingIds={trackedListingIds}
            onApplicationCreated={(application) => {
              setJobs((prev) => [application, ...prev]);
              setTab("jobs");
            }}
          />
        </div>
      ) : null}

      {jobsEntitled ? (
        <div className={activeTab === "jobs" ? undefined : "hidden"} aria-hidden={activeTab !== "jobs"}>
          <JobTrackerWorkspace initialJobs={jobs} cvDocuments={initialDocuments} />
        </div>
      ) : null}
    </Stack>
  );
}
