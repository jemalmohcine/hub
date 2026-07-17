import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { profileFullName } from "@/core/auth/types";
import { getSortedModules } from "@/core/module-registry";
import { hasEntitlement, PLAN_META } from "@/core/entitlements";
import {
  Card,
  Grid,
  ModuleCard,
  PageHeader,
  PageSection,
  Spacer,
  Stat,
} from "@/design-system";

export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const plan = user.subscription?.plan ?? "free";
  const modules = getSortedModules();
  const greeting = profileFullName(user.profile);

  return (
    <>
      <PageHeader
        title={`Bonjour${greeting ? `, ${greeting}` : ""}`}
        description="Ton hub est prêt. Explore les modules et configure ton compte."
      />

      <Grid cols={3} gap={3}>
        <Card>
          <Stat
            label="Plan"
            value={plan}
            hint={PLAN_META[plan].description}
          />
        </Card>
        <Card>
          <Stat
            label="Rôle"
            value={user.profile.role}
            hint={user.email}
          />
        </Card>
        <Card>
          <Stat
            label="Entitlements"
            value={user.entitlements.length}
            hint={
              user.entitlements.length
                ? user.entitlements.join(", ")
                : "Aucun module payant débloqué"
            }
          />
        </Card>
      </Grid>

      <Spacer size={6} />

      <PageSection title="Modules">
        <Grid cols={2} gap={3}>
          {modules.map((mod) => {
            const entitled = hasEntitlement(
              user.entitlements,
              mod.requiredEntitlement,
            );
            const locked = mod.status === "coming_soon" || !entitled;
            return (
              <ModuleCard
                key={mod.id}
                href={mod.href}
                title={mod.label}
                description={mod.description}
                icon={mod.icon}
                status={mod.status === "coming_soon" ? "coming_soon" : "active"}
                locked={!entitled && !!mod.requiredEntitlement}
                ctaLabel={locked ? "Voir le statut" : "Ouvrir"}
              />
            );
          })}
        </Grid>
      </PageSection>
    </>
  );
}
