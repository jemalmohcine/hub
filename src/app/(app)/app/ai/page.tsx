import { headers } from "next/headers";
import { requirePageUser } from "@/core/auth/get-user";
import { resolveLocale } from "@/core/i18n";
import { getAiIntelFeed } from "@/modules/ai-intel/queries";
import { AiIntelWorkspace } from "@/modules/ai-intel/ui/ai-intel-workspace";
import { t } from "@/modules/ai-intel/i18n/locale";
import { ModulePage, isModulePageUnlocked } from "@/shared/ui/module-page";

export const metadata = { title: "Intelligence AI" };

type PageProps = {
  searchParams: Promise<{ item?: string; key?: string }>;
};

export default async function AiModulePage({ searchParams }: PageProps) {
  const user = await requirePageUser();

  if (!isModulePageUnlocked(user, "ai")) {
    return <ModulePage module="ai" user={user} title="Intelligence AI" />;
  }

  const [params, headerStore, items] = await Promise.all([
    searchParams,
    headers(),
    getAiIntelFeed(user.id, {}).catch(() => []),
  ]);

  const locale = resolveLocale(
    user.preferences?.locale,
    headerStore.get("accept-language"),
  );
  const copy = t(locale);

  return (
    <ModulePage module="ai" user={user} title={copy.pageTitle}>
      <AiIntelWorkspace
        initialItems={items}
        initialLocale={locale}
        deepLinkItemId={params.item ?? null}
        deepLinkCanonicalKey={params.key ?? null}
      />
    </ModulePage>
  );
}
