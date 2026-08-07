import type { HubLocale } from "./locale";

/**
 * Shared UI strings used across modules (actions, states, gating).
 * Feature-specific copy stays inside its module — see ai-intel/i18n.
 */
export const UI = {
  fr: {
    save: "Enregistrer",
    saving: "Enregistrement…",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    add: "Ajouter",
    close: "Fermer",
    search: "Rechercher…",
    retry: "Réessayer",
    loading: "Chargement…",
    seeAll: "Voir tout",
    open: "Ouvrir",

    proBadge: "Pro",
    proTitle: "Disponible avec Pro",
    proCta: "Passer à Pro",

    emptyTitle: "Rien à afficher",
    errorTitle: "Une erreur est survenue",
    errorHint: "Réessaie dans un instant.",

    justNow: "À l’instant",
    minutesAgo: (n: number) => `Il y a ${n} min`,
    hoursAgo: (n: number) => `Il y a ${n} h`,
    daysAgo: (n: number) => `Il y a ${n} j`,
  },
  en: {
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    close: "Close",
    search: "Search…",
    retry: "Retry",
    loading: "Loading…",
    seeAll: "View all",
    open: "Open",

    proBadge: "Pro",
    proTitle: "Available with Pro",
    proCta: "Upgrade to Pro",

    emptyTitle: "Nothing to show",
    errorTitle: "Something went wrong",
    errorHint: "Try again in a moment.",

    justNow: "Just now",
    minutesAgo: (n: number) => `${n} min ago`,
    hoursAgo: (n: number) => `${n} h ago`,
    daysAgo: (n: number) => `${n} d ago`,
  },
} as const;

export type UiCopy = (typeof UI)[HubLocale];

export function tr(locale: HubLocale): UiCopy {
  return UI[locale];
}
