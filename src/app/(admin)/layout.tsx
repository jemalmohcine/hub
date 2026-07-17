import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { AppShell } from "@/shared/ui/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");
  if (user.profile.role !== "admin") redirect("/app/overview");

  return <AppShell user={user}>{children}</AppShell>;
}
