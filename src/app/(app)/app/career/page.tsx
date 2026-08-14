import { Suspense } from "react";
import { requirePageUser } from "@/core/auth/get-user";
import { hasEntitlement, ENTITLEMENTS } from "@/core/entitlements";
import { PageSkeleton } from "@/design-system";
import { defaultCvDocument } from "@/modules/cv-builder/defaults";
import { getCvDocumentById, listCvDocuments } from "@/modules/cv-builder/queries";
import { CareerWorkspace } from "@/modules/career/ui/career-workspace";
import { listJobListingsForPrefs, getJobSearchPrefs } from "@/modules/job-board/queries";
import { EMPTY_JOB_SEARCH_PREFS } from "@/modules/job-board/types";
import { listJobApplications } from "@/modules/job-tracker/queries";
import { ModulePage, isModulePageUnlocked } from "@/shared/ui/module-page";

export const metadata = { title: "Carrière" };

const CAREER_MODULES = ["cv", "jobs"] as const;

const CAREER_COPY = {
  title: "Carrière",
  description: "CV Builder, recherche d’offres en France et suivi des candidatures.",
  upsell: "Crée tes CV, adapte-les aux offres et suis tes candidatures.",
};

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function resolveTab(tab: string | undefined) {
  if (tab === "jobs") return "jobs" as const;
  if (tab === "offers") return "offers" as const;
  return "cv" as const;
}

export default async function CareerPage({ searchParams }: PageProps) {
  const user = await requirePageUser();

  if (!isModulePageUnlocked(user, [...CAREER_MODULES])) {
    return <ModulePage module={[...CAREER_MODULES]} user={user} {...CAREER_COPY} />;
  }

  const params = await searchParams;
  const cvEntitled = hasEntitlement(user.entitlements, ENTITLEMENTS.cv);
  const jobsEntitled = hasEntitlement(user.entitlements, ENTITLEMENTS.jobs);

  const prefs = jobsEntitled
    ? await getJobSearchPrefs(user.id).catch(() => ({ ...EMPTY_JOB_SEARCH_PREFS }))
    : { ...EMPTY_JOB_SEARCH_PREFS };

  const [documents, jobs, listings] = await Promise.all([
    cvEntitled ? listCvDocuments(user.id).catch(() => []) : Promise.resolve([]),
    jobsEntitled ? listJobApplications(user.id).catch(() => []) : Promise.resolve([]),
    jobsEntitled ? listJobListingsForPrefs(prefs).catch(() => []) : Promise.resolve([]),
  ]);

  const activeId = documents[0]?.id;
  const saved =
    cvEntitled && activeId
      ? await getCvDocumentById(user.id, activeId).catch(() => null)
      : null;

  return (
    <ModulePage module={[...CAREER_MODULES]} user={user} {...CAREER_COPY}>
      <Suspense fallback={<PageSkeleton rows={3} withHeader={false} />}>
        <CareerWorkspace
          initialTab={resolveTab(params.tab)}
          cvEntitled={cvEntitled}
          jobsEntitled={jobsEntitled}
          initialDoc={saved ?? defaultCvDocument()}
          initialDocuments={documents}
          initialJobs={jobs}
          initialListings={listings}
          initialPrefs={prefs}
        />
      </Suspense>
    </ModulePage>
  );
}
