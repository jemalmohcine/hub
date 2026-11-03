/** Page title shown in the app shell top bar (mobile + desktop). */
export function resolveAppShellPageTitle(path: string): string {
  if (path.startsWith("/app/ai") || path.startsWith("/app/veille")) return "Veille";
  if (path.startsWith("/app/snippets")) return "Snippets";
  if (path.startsWith("/app/outils/json")) return "JSON";
  if (path.startsWith("/app/outils/encode")) return "Base64 / URL";
  if (path.startsWith("/app/outils/jwt")) return "JWT";
  if (path.startsWith("/app/outils/regex")) return "Regex";
  if (path.startsWith("/app/outils/uuid")) return "UUID / hash";
  if (path.startsWith("/app/outils/timestamp")) return "Timestamp";
  if (path.startsWith("/app/outils/color")) return "Couleurs";
  if (path.startsWith("/app/outils")) return "Outils";
  if (path.startsWith("/app/career")) return "Carrière";
  if (path.startsWith("/app/expenses")) return "Budget";
  if (path.startsWith("/app/settings/account")) return "Compte";
  if (path.startsWith("/app/settings/appearance")) return "Apparence";
  if (path.startsWith("/app/settings/security")) return "Sécurité";
  if (path.startsWith("/app/settings/billing")) return "Facturation";
  if (path.startsWith("/app/settings/modules")) return "Modules";
  if (path.startsWith("/app/settings")) return "Paramètres";
  if (path === "/admin") return "Admin";
  if (path.startsWith("/app/overview")) return "Accueil";
  return "hub";
}
