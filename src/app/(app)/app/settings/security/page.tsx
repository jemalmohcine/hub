import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { signOut } from "@/core/auth/actions";
import { Button, Card, PageHeader } from "@/shared/ui";

export const metadata = { title: "Sécurité" };

export default async function SecuritySettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  return (
    <div>
      <PageHeader
        title="Sécurité"
        description="Gère la session de ton compte DevHub."
      />
      <Card className="space-y-4">
        <div>
          <p className="text-sm text-muted">Compte connecté</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Rôle</p>
          <p className="font-medium capitalize">{user.profile.role}</p>
        </div>
        <p className="text-sm text-muted">
          Le changement de mot de passe et la gestion des sessions multi-appareils
          passent par Supabase Auth (email reset / providers OAuth).
        </p>
        <form action={signOut}>
          <Button type="submit" variant="danger">
            Se déconnecter
          </Button>
        </form>
      </Card>
    </div>
  );
}
