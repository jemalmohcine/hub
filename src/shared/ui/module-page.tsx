import { type ReactNode } from "react";
import { Lock } from "lucide-react";
import type { HubUser } from "@/core/auth/types";
import { hasEntitlement } from "@/core/entitlements";
import { getModule, type ModuleDefinition, type ModuleId } from "@/core/module-registry";
import {
  Atmosphere,
  Badge,
  Card,
  Cluster,
  Heading,
  IconBox,
  LinkButton,
  PageHeader,
  Stack,
  Text,
} from "@/design-system";

const BILLING_HREF = "/app/settings/billing";

type ModulePageProps = {
  /** A single module, or several when one page hosts more than one (Carrière). */
  module: ModuleId | ModuleId[];
  user: HubUser;
  /** Overrides the registry label. */
  title?: string;
  /** Overrides the registry page description. */
  description?: string;
  /** Overrides the registry Pro pitch. */
  upsell?: string;
  /** Rendered on the right of the header when unlocked. */
  action?: ReactNode;
  children?: ReactNode;
};

/** True when the user owns at least one of the page's modules. */
export function isModulePageUnlocked(
  user: HubUser,
  module: ModuleId | ModuleId[],
): boolean {
  const ids = Array.isArray(module) ? module : [module];
  return ids.some((id) =>
    hasEntitlement(user.entitlements, getModule(id).requiredEntitlement),
  );
}

/**
 * Header + Pro gate for every module page.
 * Replaces the upsell card that used to be copy-pasted in each `page.tsx`.
 */
export function ModulePage({
  module,
  user,
  title,
  description,
  upsell,
  action,
  children,
}: ModulePageProps) {
  const primary: ModuleDefinition = getModule(
    Array.isArray(module) ? module[0] : module,
  );
  const heading = title ?? primary.label;

  if (!isModulePageUnlocked(user, module)) {
    return (
      <>
        <PageHeader
          title={heading}
          description={description ?? primary.description}
          action={<Badge tone="warning">Pro</Badge>}
        />
        <Card>
          <Atmosphere variant="module" />
          <Cluster gap={3} align="start">
            <IconBox icon={primary.icon} size="lg" />
            <Stack gap={4} className="flex-1">
              <div>
                <Heading level={3}>Disponible avec Pro</Heading>
                <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
                  {upsell ?? primary.upsell}
                </Text>
              </div>
              <LinkButton href={BILLING_HREF}>
                <Lock className="h-4 w-4" />
                Passer à Pro
              </LinkButton>
            </Stack>
          </Cluster>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={heading}
        description={description ?? primary.pageDescription}
        action={action}
      />
      {children}
    </>
  );
}
