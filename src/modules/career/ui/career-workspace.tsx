"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Briefcase } from "lucide-react";
import { Stack } from "@/design-system";
import type { CvDocument, CvDocumentSummary } from "@/modules/cv-builder/types";
import { CvBuilderWorkspace } from "@/modules/cv-builder/ui/cv-builder-workspace";
import type { JobApplication } from "@/modules/job-tracker/types";
import { JobTrackerWorkspace } from "@/modules/job-tracker/ui/job-tracker-workspace";
import { cn } from "@/lib/utils";

export type CareerTab = "cv" | "jobs";

const TABS: Array<{ id: CareerTab; label: string; icon: typeof FileText }> = [
  { id: "cv", label: "CV Builder", icon: FileText },
  { id: "jobs", label: "Candidatures", icon: Briefcase },
];

function tabFromParams(params: URLSearchParams, fallback: CareerTab): CareerTab {
  const param = params.get("tab");
  if (param === "jobs" || param === "cv") return param;
  return fallback;
}

export function CareerWorkspace({
  initialTab,
  cvEntitled,
  jobsEntitled,
  initialDoc,
  initialDocuments,
  initialJobs,
}: {
  initialTab: CareerTab;
  cvEntitled: boolean;
  jobsEntitled: boolean;
  initialDoc: CvDocument;
  initialDocuments: CvDocumentSummary[];
  initialJobs: JobApplication[];
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<CareerTab>(() =>
    tabFromParams(searchParams, initialTab),
  );

  useEffect(() => {
    setActiveTab(tabFromParams(searchParams, initialTab));
  }, [searchParams, initialTab]);

  function setTab(tab: CareerTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    const url = `/app/career?tab=${tab}`;
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <Stack gap={4}>
      <div className="flex gap-1 rounded-2xl bg-muted/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const disabled =
            (tab.id === "cv" && !cvEntitled) || (tab.id === "jobs" && !jobsEntitled);
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => setTab(tab.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
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
        <div className={activeTab === "jobs" ? undefined : "hidden"} aria-hidden={activeTab !== "jobs"}>
          <JobTrackerWorkspace initialJobs={initialJobs} cvDocuments={initialDocuments} />
        </div>
      ) : null}
    </Stack>
  );
}
