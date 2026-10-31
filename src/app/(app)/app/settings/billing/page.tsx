import { requirePageUser } from "@/core/auth/get-user";
import { formatDate } from "@/lib/dates";
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
  const user = await requirePageUser();

  const sub = user.subscription;
  const plan = sub?.plan ?? "free";

  return (
    <>
      <SettingsBackLink />
      <PageHeader
        title="Abonnement"
        description="Ton plan actuel et les options disponibles."
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
                value={formatDate(sub.current_period_end, "fr", "short")}
              />
            ) : null}
          </div>
        </SettingsSection>
      </Card>

      <Spacer size={4} />

      <Card>
        <SettingsSection
          title="Changer de plan"
          description="Aucun paiement réel pour l’instant."
        >
          <BillingForm user={user} />
        </SettingsSection>
      </Card>

      <Text size="xs" tone="muted" className="mt-4">
        Le paiement se branchera plus tard. Pour l’instant, tu peux tester les
        plans sans débiter ta carte.
      </Text>
    </>
  );
}
