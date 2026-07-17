import { createClient } from "@/core/auth/supabase/server";
import { getSortedModules } from "@/core/module-registry";
import { toggleModuleFlag } from "@/core/auth/actions";
import {
  Badge,
  Card,
  FlagRow,
  Grid,
  PageHeader,
  PageSection,
  Spacer,
  Stat,
} from "@/design-system";

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
    <>
      <PageHeader
        title="Admin"
        description="Flags modules et vue plateforme."
        action={<Badge tone="brand">admin</Badge>}
      />

      <Grid cols={2} gap={3}>
        <Card>
          <Stat label="Users" value={count ?? "—"} />
        </Card>
        <Card>
          <Stat label="Modules" value={getSortedModules().length} />
        </Card>
      </Grid>

      <Spacer size={6} />

      <PageSection title="Module flags">
        <div className="space-y-[var(--dh-space-3)]">
          {getSortedModules().map((mod) => {
            const enabled = flagMap.get(mod.id) ?? true;
            return (
              <FlagRow
                key={mod.id}
                title={mod.label}
                description={
                  enabled ? "Enabled globally" : "Disabled globally"
                }
                actionLabel={enabled ? "Disable" : "Enable"}
                action={async () => {
                  "use server";
                  await toggleModuleFlag(mod.id, !enabled);
                }}
              />
            );
          })}
        </div>
      </PageSection>
    </>
  );
}
