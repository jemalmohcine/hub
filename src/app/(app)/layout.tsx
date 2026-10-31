import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getHubUser } from "@/core/auth/get-user";
import { hasEntitlement, ENTITLEMENTS } from "@/core/entitlements";
import { resolveLocale } from "@/core/i18n";
import { getHubNotifications } from "@/modules/notifications/queries";
import { JobOffersSilentRefresh } from "@/modules/job-board/ui/job-offers-silent-refresh";
import { AppShell } from "@/shared/ui/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getHubUser();
  if (!user) {
    redirect("/sign-in");
  }

  const headerStore = await headers();
  const locale = resolveLocale(
    user.preferences?.locale,
    headerStore.get("accept-language"),
  );

  const notifications = await getHubNotifications(user.id).catch(() => []);

  return (
    <AppShell user={user} notifications={notifications} locale={locale}>
      {hasEntitlement(user.entitlements, ENTITLEMENTS.jobs) ? (
        <JobOffersSilentRefresh />
      ) : null}
      {children}
    </AppShell>
  );
}
