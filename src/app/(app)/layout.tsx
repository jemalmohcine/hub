import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { getHubNotifications } from "@/modules/notifications/queries";
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

  const notifications = await getHubNotifications(user.id).catch(() => []);

  return (
    <AppShell user={user} notifications={notifications}>
      {children}
    </AppShell>
  );
}
