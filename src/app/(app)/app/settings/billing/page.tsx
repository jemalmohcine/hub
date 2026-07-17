import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { Card, PageHeader, Badge } from "@/shared/ui";
import { BillingForm } from "@/shared/ui/settings-forms";
import { getPaymentProvider } from "@/core/billing";

export const metadata = { title: "Abonnement" };

export default async function BillingSettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const provider = getPaymentProvider();
  const sub = user.subscription;

  return (
    <div>
      <PageHeader
        title="Abonnement"
        description="Choisis ton plan. Le provider de paiement reste interchangeable."
        action={<Badge tone="accent">Provider: {provider.id}</Badge>}
      />

      <Card className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted">Statut:</span>
          <span className="font-medium capitalize">{sub?.status ?? "active"}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">Plan:</span>
          <span className="font-medium capitalize">{sub?.plan ?? "free"}</span>
        </div>
        {sub?.current_period_end ? (
          <p className="text-sm text-muted">
            Période jusqu&apos;au{" "}
            {new Date(sub.current_period_end).toLocaleDateString("fr-FR")}
          </p>
        ) : null}
      </Card>

      <Card>
        <BillingForm user={user} />
      </Card>
    </div>
  );
}
