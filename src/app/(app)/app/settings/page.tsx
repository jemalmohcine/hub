import { redirect } from "next/navigation";
import {
  ChevronRight,
  CreditCard,
  LayoutGrid,
  Palette,
  Shield,
  UserRound,
} from "lucide-react";
import { getHubUser } from "@/core/auth/get-user";
import { profileFullName } from "@/core/auth/types";
import {
  IconBox,
  PageHeader,
  SettingsAccountCard,
  SettingsNavRow,
  SettingsSection,
  Spacer,
  Stack,
  Text,
} from "@/design-system";

export const metadata = { title: "Settings" };

const SECTIONS = [
  {
    href: "/app/settings/account",
    title: "Compte",
    description: "Prénom, nom et informations personnelles",
    icon: UserRound,
  },
  {
    href: "/app/settings/appearance",
    title: "Apparence",
    description: "Thème, langue et notifications",
    icon: Palette,
  },
  {
    href: "/app/settings/security",
    title: "Sécurité",
    description: "Mot de passe, session et déconnexion",
    icon: Shield,
  },
  {
    href: "/app/settings/billing",
    title: "Abonnement",
    description: "Plan Free / Pro et entitlements",
    icon: CreditCard,
  },
  {
    href: "/app/settings/modules",
    title: "Modules",
    description: "Accès et statut de chaque module",
    icon: LayoutGrid,
  },
] as const;

export default async function SettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const plan = user.subscription?.plan ?? "free";
  const name =
    profileFullName(user.profile) || user.email.split("@")[0] || "Compte";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Gère ton compte et ton hub en un seul endroit."
      />

      <SettingsAccountCard
        name={name}
        email={user.email}
        plan={plan}
        role={user.profile.role}
      />

      <Spacer size={6} />

      <SettingsSection
        title="Paramètres"
        description="Choisis une section pour modifier tes préférences."
      >
        <Stack gap={2}>
          {SECTIONS.map((section) => (
            <SettingsNavRow
              key={section.href}
              href={section.href}
              title={section.title}
              description={section.description}
              icon={<IconBox icon={section.icon} size="md" />}
              trailing={
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              }
            />
          ))}
        </Stack>
      </SettingsSection>

      <Spacer size={6} />

      <Text size="xs" tone="muted" className="text-center sm:text-left">
        Les changements de thème s’appliquent immédiatement. Le reste est
        sauvegardé sur ton compte.
      </Text>
    </>
  );
}
