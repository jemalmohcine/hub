import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Briefcase, Lock } from "lucide-react";
import { getHubUser } from "@/core/auth/get-user";
import { hasEntitlement } from "@/core/entitlements";
import {
  Atmosphere,
  Badge,
  Card,
  Cluster,
  Heading,
  IconBox,
  LinkButton,
  PageHeader,
  Stack,
  Text,
} from "@/design-system";
import { defaultCvDocument } from "@/modules/cv-builder/defaults";
import { getCvDocumentById, listCvDocuments } from "@/modules/cv-builder/queries";
import { CareerWorkspace } from "@/modules/career/ui/career-workspace";
import { listJobApplications } from "@/modules/job-tracker/queries";

export const metadata = { title: "Carrière" };

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function CareerPage({ searchParams }: PageProps) {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const cvEntitled = hasEntitlement(user.entitlements, "module:cv");
  const jobsEntitled = hasEntitlement(user.entitlements, "module:jobs");
  const initialTab = params.tab === "jobs" ? "jobs" : "cv";

  if (!cvEntitled && !jobsEntitled) {
    return (
      <>
        <PageHeader
          title="Carrière"
          description="CV Builder et suivi des candidatures."
          action={<Badge tone="warning">Pro</Badge>}
        />
        <Card>
          <Atmosphere variant="module" />
          <Cluster gap={3} align="start">
            <IconBox icon={Briefcase} size="lg" />
            <Stack gap={4} className="flex-1">
              <div>
                <Heading level={3}>Disponible avec Pro</Heading>
                <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
                  Créez vos CV, adaptez-les aux offres et suivez vos candidatures.
                </Text>
              </div>
              <LinkButton href="/app/settings/billing">
                <Lock className="h-4 w-4" />
                Passer à Pro
              </LinkButton>
            </Stack>
          </Cluster>
        </Card>
      </>
    );
  }

  const [documents, jobs] = await Promise.all([
    cvEntitled ? listCvDocuments(user.id).catch(() => []) : Promise.resolve([]),
    jobsEntitled ? listJobApplications(user.id).catch(() => []) : Promise.resolve([]),
  ]);

  const activeId = documents[0]?.id;
  const saved =
    cvEntitled && activeId
      ? await getCvDocumentById(user.id, activeId).catch(() => null)
      : null;
  const initialDoc = saved ?? defaultCvDocument();

  return (
    <>
      <PageHeader
        title="Carrière"
        description="CV Builder et suivi des candidatures au même endroit."
      />
      <Suspense fallback={null}>
        <CareerWorkspace
          initialTab={initialTab}
          cvEntitled={cvEntitled}
          jobsEntitled={jobsEntitled}
          initialDoc={initialDoc}
          initialDocuments={documents}
          initialJobs={jobs}
        />
      </Suspense>
    </>
  );
}
