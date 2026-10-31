import { headers } from "next/headers";
import { requirePageUser } from "@/core/auth/get-user";
import { resolveLocale } from "@/core/i18n";
import {
  getVeilleItemsRecent,
  resolveDefaultVeilleDay,
} from "@/modules/ai-intel/veille/queries";
import {
  DEV_VEILLE_DEMO_DAYS,
  DEV_VEILLE_DEMO_ITEMS,
} from "@/modules/ai-intel/veille/demo-seed";
import { VeilleWorkspace } from "@/modules/ai-intel/ui/ai-intel-workspace";
import { t } from "@/modules/ai-intel/i18n/locale";
import { ModulePage, isModulePageUnlocked } from "@/shared/ui/module-page";

export const metadata = { title: "Veille IA" };

type PageProps = {
  searchParams: Promise<{
    item?: string;
    day?: string;
  }>;
};

export default async function AiModulePage({ searchParams }: PageProps) {
  const user = await requirePageUser();

  if (!isModulePageUnlocked(user, "ai")) {
    return <ModulePage module="ai" user={user} title="Veille IA" />;
  }

  const [params, headerStore, recent] = await Promise.all([
    searchParams,
    headers(),
    getVeilleItemsRecent(user.id).catch(() => ({ items: [], days: [] })),
  ]);

  const locale = resolveLocale(
    user.preferences?.locale,
    headerStore.get("accept-language"),
  );
  const copy = t(locale);

  const useDemo =
    process.env.NODE_ENV === "development" && recent.items.length === 0;
  const items = useDemo ? DEV_VEILLE_DEMO_ITEMS : recent.items;
  const days = useDemo ? DEV_VEILLE_DEMO_DAYS : recent.days;

  const initialDay =
    params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day)
      ? params.day
      : days[0] ?? (await resolveDefaultVeilleDay());

  return (
    <ModulePage module="ai" user={user} title={copy.pageTitle}>
      <VeilleWorkspace
        initialItems={items}
        initialDay={initialDay}
        availableDays={days}
        initialLocale={locale}
        deepLinkItemId={params.item ?? null}
      />
    </ModulePage>
  );
}
