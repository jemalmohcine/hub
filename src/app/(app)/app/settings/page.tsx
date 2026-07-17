import Link from "next/link";
import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { Card, PageHeader } from "@/shared/ui";
import { ProfileForm, PreferencesForm } from "@/shared/ui/settings-forms";
import { ChevronRight } from "lucide-react";

export const metadata = { title: "Settings" };

const LINKS = [
  {
    href: "/app/settings/security",
    title: "Sécurité",
    description: "Sessions et compte",
  },
  {
    href: "/app/settings/billing",
    title: "Abonnement",
    description: "Plan et paiement (mock)",
  },
  {
    href: "/app/settings/modules",
    title: "Modules",
    description: "Accès et statut des modules",
  },
];

export default async function SettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Profil, préférences et accès à ton hub."
      />

      <div className="mb-4 grid gap-2">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="flex items-center justify-between gap-3 transition hover:border-accent/40">
              <div>
                <p className="font-medium">{link.title}</p>
                <p className="text-sm text-muted">{link.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Profil</h2>
          <ProfileForm user={user} />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Préférences</h2>
          <PreferencesForm user={user} />
        </Card>
      </div>
    </div>
  );
}
