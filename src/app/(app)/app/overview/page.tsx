import Link from "next/link";
import { getHubUser } from "@/core/auth/get-user";
import { getSortedModules } from "@/core/module-registry";
import { hasEntitlement, PLAN_META } from "@/core/entitlements";
import { Badge, Card, PageHeader } from "@/shared/ui";
import { ArrowRight, Lock } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const plan = user.subscription?.plan ?? "free";
  const modules = getSortedModules();

  return (
    <div>
      <PageHeader
        title={`Bonjour${user.profile.display_name ? `, ${user.profile.display_name}` : ""}`}
        description="Ton hub est prêt. Explore les modules et configure ton compte."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Plan</p>
          <p className="mt-1 text-xl font-semibold capitalize">{plan}</p>
          <p className="mt-1 text-sm text-muted">{PLAN_META[plan].description}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Rôle</p>
          <p className="mt-1 text-xl font-semibold capitalize">
            {user.profile.role}
          </p>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Entitlements</p>
          <p className="mt-1 text-xl font-semibold">
            {user.entitlements.length}
          </p>
          <p className="mt-1 text-sm text-muted">
            {user.entitlements.length
              ? user.entitlements.join(", ")
              : "Aucun module payant débloqué"}
          </p>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Modules</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const entitled = hasEntitlement(
            user.entitlements,
            mod.requiredEntitlement,
          );
          const locked = mod.status === "coming_soon" || !entitled;

          return (
            <Link key={mod.id} href={mod.href}>
              <Card className="h-full transition hover:border-accent/40">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{mod.label}</h3>
                      {mod.status === "coming_soon" ? (
                        <Badge tone="warn">Coming soon</Badge>
                      ) : null}
                      {!entitled && mod.requiredEntitlement ? (
                        <Badge>
                          <Lock className="mr-1 inline h-3 w-3" />
                          Pro
                        </Badge>
                      ) : (
                        <Badge tone="success">Actif</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{mod.description}</p>
                    <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                      {locked ? "Voir le statut" : "Ouvrir"}
                      <ArrowRight className="h-4 w-4" />
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
