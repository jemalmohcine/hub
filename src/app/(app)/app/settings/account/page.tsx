import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { profileFullName } from "@/core/auth/types";
import { ProfileForm } from "@/shared/ui/settings-forms";
import {
  Card,
  PageHeader,
  SettingsBackLink,
  Text,
} from "@/design-system";

export const metadata = { title: "Compte" };

export default async function AccountSettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <SettingsBackLink />
      <PageHeader
        title="Compte"
        description="Prénom, nom et identité affichée dans le hub."
      />
      <Card>
        <ProfileForm user={user} />
      </Card>
      <Text size="xs" tone="muted" className="mt-4">
        Affiché comme{" "}
        <span className="font-medium text-foreground">
          {profileFullName(user.profile) || "—"}
        </span>
        . L’email est géré par Supabase Auth.
      </Text>
    </>
  );
}
