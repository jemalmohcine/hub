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
import { listCvDocuments } from "@/modules/cv-builder/queries";
import { listJobApplications } from "@/modules/job-tracker/queries";
import { JobTrackerWorkspace } from "@/modules/job-tracker/ui/job-tracker-workspace";

export const metadata = { title: "Suivi candidatures" };

export default async function JobsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const entitled = hasEntitlement(user.entitlements, "module:jobs");

  if (!entitled) {
    return (
      <>
        <PageHeader
          title="Suivi candidatures"
          description="Pipeline de candidatures, relances et CV associés."
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
                  Suivez vos candidatures de l&apos;offre à l&apos;entretien, liez un CV
                  adapté à chaque poste.
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

  const [jobs, cvDocuments] = await Promise.all([
    listJobApplications(user.id).catch(() => []),
    listCvDocuments(user.id).catch(() => []),
  ]);

  return (
    <>
      <PageHeader
        title="Suivi candidatures"
        description="Kanban de vos candidatures : à postuler, envoyées, entretiens, offres."
      />
      <JobTrackerWorkspace initialJobs={jobs} cvDocuments={cvDocuments} />
    </>
  );
}
