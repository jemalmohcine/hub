import { headers } from "next/headers";
import { requirePageUser } from "@/core/auth/get-user";
import { profileFullName } from "@/core/auth/types";
import { resolveLocale } from "@/core/i18n";
import { getSortedModules } from "@/core/module-registry";
import { hasEntitlement } from "@/core/entitlements";
import { formatDateTime } from "@/lib/dates";
import { Grid, ModuleCard, PageHeader, PageSection, Spacer } from "@/design-system";
import { PushEnableBanner } from "@/modules/notifications/ui/push-enable";
import { getTodayDigest } from "@/modules/today/queries";
import { TodayBoard } from "@/modules/today/ui/today-board";

export const metadata = { title: "Overview" };

function greetingFor(hour: number): string {
  if (hour < 6) return "Bonne nuit";
  if (hour < 18) return "Bonjour";
  return "Bonsoir";
}

export default async function OverviewPage() {
  const user = await requirePageUser();

  const [headerStore, digest] = await Promise.all([
    headers(),
    getTodayDigest(user),
  ]);

  const locale = resolveLocale(
    user.preferences?.locale,
    headerStore.get("accept-language"),
  );

  const name = profileFullName(user.profile);
  const greeting = greetingFor(new Date().getHours());
  const lastRun = formatDateTime(digest.lastRunAt, locale);

  return (
    <>
      <PageHeader
        title={`${greeting}${name ? `, ${name}` : ""}`}
        description={
          lastRun
            ? `Dernière veille · ${lastRun}`
            : "Ton hub est prêt. Explore les modules et configure ton compte."
        }
      />

      <TodayBoard digest={digest} />

      <Spacer size={4} />
      <PushEnableBanner />

      <Spacer size={6} />

      <PageSection title="Modules">
        <Grid cols={2} gap={3}>
          {getSortedModules().map((mod) => {
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
