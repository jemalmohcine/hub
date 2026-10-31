import { Suspense } from "react";
import { requirePageUser } from "@/core/auth/get-user";
import { hasEntitlement, ENTITLEMENTS } from "@/core/entitlements";
import { PageSkeleton } from "@/design-system";
import { defaultCvDocument } from "@/modules/cv-builder/defaults";
import { listCvDocuments, listCvDocumentsFull } from "@/modules/cv-builder/queries";
import { CareerWorkspace } from "@/modules/career/ui/career-workspace";
import { listJobApplications } from "@/modules/job-tracker/queries";
import { ModulePage, isModulePageUnlocked } from "@/shared/ui/module-page";

export const metadata = { title: "Carrière" };

const CAREER_MODULES = ["cv", "jobs"] as const;

const CAREER_COPY = {
  title: "Carrière",
  description: "CV builder et suivi de tes candidatures avec rappels.",
  upsell: "Crée tes CV, adapte-les aux offres et suis tes candidatures.",
};

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function resolveTab(tab: string | undefined) {
  if (tab === "jobs") return "jobs" as const;
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

  const [documents, fullCvs] = cvEntitled
    ? await Promise.all([
        listCvDocuments(user.id).catch(() => []),
        listCvDocumentsFull(user.id).catch(() => []),
      ])
    : [[], []];
  const saved = fullCvs[0] ?? null;

  const jobs = jobsEntitled
    ? await listJobApplications(user.id).catch(() => [])
    : [];

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
        />
      </Suspense>
    </ModulePage>
  );
}
