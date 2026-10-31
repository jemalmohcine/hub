import { requirePageUser } from "@/core/auth/get-user";
import { listDevSnippetCategories, listDevSnippets } from "@/modules/dev-snippets/queries";
import { SnippetsWorkspace } from "@/modules/dev-snippets/ui/snippets-workspace";
import { ModulePage, isModulePageUnlocked } from "@/shared/ui/module-page";

export const metadata = { title: "Dev Snippets" };

export default async function SnippetsPage() {
  const user = await requirePageUser();

  if (!isModulePageUnlocked(user, "snippets")) {
    return <ModulePage module="snippets" user={user} />;
  }

  const snippets = await listDevSnippets(user.id).catch(() => []);
  const categories = await listDevSnippetCategories(user.id).catch(() => []);

  return (
    <ModulePage module="snippets" user={user}>
      <SnippetsWorkspace initialSnippets={snippets} initialCategories={categories} />
    </ModulePage>
  );
}
