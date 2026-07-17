import { createClient } from "@/core/auth/supabase/server";
import { getSortedModules } from "@/core/module-registry";
import { toggleModuleFlag } from "@/core/auth/actions";
import { Badge, Button, Card, PageHeader } from "@/shared/ui";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: flags } = await supabase.from("module_flags").select("*");
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const flagMap = new Map(
    (flags ?? []).map((f: { module_id: string; enabled: boolean }) => [
      f.module_id,
      f.enabled,
    ]),
  );

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Flags modules et vue plateforme."
        action={<Badge tone="accent">admin</Badge>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Users</p>
          <p className="mt-1 text-2xl font-semibold">{count ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Modules</p>
          <p className="mt-1 text-2xl font-semibold">
            {getSortedModules().length}
          </p>
        </Card>
      </div>

      <h2 className="mb-3 font-semibold">Module flags</h2>
      <div className="space-y-3">
        {getSortedModules().map((mod) => {
          const enabled = flagMap.get(mod.id) ?? true;
          return (
            <Card
              key={mod.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium">{mod.label}</p>
                <p className="text-sm text-muted">
                  {enabled ? "Enabled globally" : "Disabled globally"}
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await toggleModuleFlag(mod.id, !enabled);
                }}
              >
                <Button type="submit" variant="secondary">
                  {enabled ? "Disable" : "Enable"}
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
