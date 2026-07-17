import Link from "next/link";
import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { hasEntitlement } from "@/core/entitlements";
import { Badge, Button, Card, PageHeader } from "@/shared/ui";
import { Bot, Lock } from "lucide-react";

export const metadata = { title: "AI" };

export default async function AiModulePage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const entitled = hasEntitlement(user.entitlements, "module:ai");

  return (
    <div>
      <PageHeader
        title="AI Intelligence"
        description="Veille modèles, prix, capacity, repos et guides d'implémentation."
        action={<Badge tone="warn">Phase 2 · Coming soon</Badge>}
      />

      <Card className="overflow-hidden">
        <div
          className="mb-5 h-32 rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,118,110,0.35), rgba(12,18,34,0.1) 60%), radial-gradient(circle at 80% 20%, rgba(45,212,191,0.35), transparent 50%)",
          }}
        />
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Bot className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Module en préparation</h2>
            <p className="mt-2 text-sm text-muted">
              Le hub est prêt. Le module AI sera branché en phase 2 avec feed
              unifié, changements de prix / context window, repos tendance et
              résumés d&apos;implémentation.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>• Nouveaux modèles & dépréciations</li>
              <li>• Changements de pricing et de capacité tokens</li>
              <li>• Repos GitHub tendance + how-to</li>
              <li>• Filtres, watchlist et alertes</li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-2">
              {!entitled ? (
                <Link href="/app/settings/billing">
                  <Button>
                    <Lock className="h-4 w-4" />
                    Débloquer avec Pro
                  </Button>
                </Link>
              ) : (
                <Badge tone="success">Entitlement Pro actif</Badge>
              )}
              <Link href="/app/settings/modules">
                <Button variant="secondary">Voir mes modules</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
