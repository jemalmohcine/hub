import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { getPaymentProvider } from "@/core/billing";
import { PLAN_META } from "@/core/entitlements";
import { BillingForm } from "@/shared/ui/settings-forms";
import {
  Badge,
  Card,
  PageHeader,
  SettingsBackLink,
  SettingsMetaRow,
  SettingsSection,
  Spacer,
  Text,
} from "@/design-system";

export const metadata = { title: "Abonnement" };

export default async function BillingSettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const provider = getPaymentProvider();
  const sub = user.subscription;
  const plan = sub?.plan ?? "free";

  return (
    <>
      <SettingsBackLink />
      <PageHeader
        title="Abonnement"
        description="Ton plan actuel et les options disponibles."
        action={<Badge tone="neutral">Provider · {provider.id}</Badge>}
      />

      <Card>
        <SettingsSection title="Résumé">
          <div className="-mt-1">
            <SettingsMetaRow
              label="Plan"
              value={
                <span className="capitalize">
                  {PLAN_META[plan].label} · {PLAN_META[plan].priceLabel}
                </span>
              }
            />
            <SettingsMetaRow
              label="Statut"
              value={
                <Badge tone={sub?.status === "active" ? "success" : "warning"}>
                  {sub?.status ?? "active"}
                </Badge>
              }
            />
            {sub?.current_period_end ? (
              <SettingsMetaRow
                label="Période"
                value={new Date(sub.current_period_end).toLocaleDateString(
                  "fr-FR",
                )}
              />
            ) : null}
          </div>
        </SettingsSection>
      </Card>

      <Spacer size={4} />

      <Card>
        <SettingsSection
          title="Changer de plan"
          description="Mock billing — aucun paiement réel pour l’instant."
        >
          <BillingForm user={user} />
        </SettingsSection>
      </Card>

      <Text size="xs" tone="muted" className="mt-4">
        Branche Stripe, Lemon Squeezy ou Paddle plus tard via{" "}
        <code className="font-mono text-[0.7rem]">PaymentProvider</code>.
      </Text>
    </>
  );
}
