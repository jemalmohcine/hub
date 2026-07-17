import Link from "next/link";
import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { getSortedModules } from "@/core/module-registry";
import { hasEntitlement } from "@/core/entitlements";
import { Badge, Button, Card, PageHeader } from "@/shared/ui";
import { Lock } from "lucide-react";

export const metadata = { title: "Modules" };

export default async function ModulesSettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const modules = getSortedModules();

  return (
    <div>
      <PageHeader
        title="Modules"
        description="Modules visibles selon ton plan et le registry hub."
      />

      <div className="space-y-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const entitled = hasEntitlement(
            user.entitlements,
            mod.requiredEntitlement,
          );

          return (
            <Card key={mod.id} className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{mod.label}</h3>
                  {mod.status === "coming_soon" ? (
                    <Badge tone="warn">Coming soon</Badge>
                  ) : (
                    <Badge tone="success">Active</Badge>
                  )}
                  {mod.requiredEntitlement && !entitled ? (
                    <Badge>
                      <Lock className="mr-1 inline h-3 w-3" />
                      Locked
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted">{mod.description}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  entitlement: {mod.requiredEntitlement ?? "none"}
                </p>
                <div className="mt-3">
                  <Link href={mod.href}>
                    <Button variant="secondary">Ouvrir</Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
