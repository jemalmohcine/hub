export type NotificationCategory = "ai" | "billing" | "account" | "system" | "jobs";
export type NotificationSeverity = "info" | "success" | "warning" | "urgent";

export type HubNotification = {
  id: string;
  user_id: string | null;
  category: NotificationCategory;
  title: string;
  body: string;
  href: string | null;
  severity: NotificationSeverity;
  dedupe_key: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  read: boolean;
};

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  ai: "AI",
  billing: "Paiement",
  account: "Compte",
  system: "Platform",
  jobs: "Offres",
};
