import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { signOut } from "@/core/auth/actions";
import { ChangePasswordForm } from "@/shared/ui/auth-forms";
import {
  Alert,
  Button,
  Card,
  Form,
  PageHeader,
  SettingsBackLink,
  SettingsMetaRow,
  SettingsSection,
  Spacer,
  Stack,
  Text,
} from "@/design-system";

export const metadata = { title: "Sécurité" };

export default async function SecuritySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;

  return (
    <>
      <SettingsBackLink />
      <PageHeader
        title="Sécurité"
        description="Mot de passe, session et accès à ton compte."
      />

      {params.password === "updated" ? (
        <Alert tone="success" className="mb-4">
          Mot de passe mis à jour.
        </Alert>
      ) : null}

      <Card>
        <SettingsSection title="Compte connecté">
          <div className="-mt-1">
            <SettingsMetaRow label="Email" value={user.email} />
            <SettingsMetaRow
              label="Rôle"
              value={<span className="capitalize">{user.profile.role}</span>}
            />
          </div>
        </SettingsSection>
      </Card>

      <Spacer size={4} />

      <Card>
        <Stack gap={4}>
          <div>
            <Text weight="medium">Changer le mot de passe</Text>
            <Text size="sm" tone="muted" className="mt-1">
              Pour les comptes email/mot de passe. Les comptes OAuth se gèrent
              chez le fournisseur.
            </Text>
          </div>
          <ChangePasswordForm />
        </Stack>
      </Card>

      <Spacer size={4} />

      <Card>
        <Stack gap={4}>
          <div>
            <Text weight="medium">Session</Text>
            <Text size="sm" tone="muted" className="mt-1">
              Déconnecte-toi de cet appareil.
            </Text>
          </div>
          <Form action={signOut}>
            <Button type="submit" variant="danger">
              Se déconnecter
            </Button>
          </Form>
        </Stack>
      </Card>
    </>
  );
}
