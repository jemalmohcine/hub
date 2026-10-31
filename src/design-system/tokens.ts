/**
 * Typed mirrors of CSS tokens in `src/assets/styles/`.
 * Prefer Tailwind utilities (`bg-primary`) in components.
 */
export const colors = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  card: "var(--card)",
  border: "var(--border)",
  destructive: "var(--destructive)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
} as const;

export const space = {
  0: "var(--spacing-0)",
  1: "var(--spacing-1)",
  2: "var(--spacing-2)",
  3: "var(--spacing-3)",
  4: "var(--spacing-4)",
  5: "var(--spacing-5)",
  6: "var(--spacing-6)",
  8: "var(--spacing-8)",
  10: "var(--spacing-10)",
  12: "var(--spacing-12)",
  16: "var(--spacing-16)",
} as const;

export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  full: "var(--radius-full)",
} as const;

export const layout = {
  sidebarW: "var(--sidebar-w)",
  topbarH: "var(--topbar-h)",
  bottomNavH: "var(--bottom-nav-h)",
  contentMax: "var(--content-max)",
  authMax: "var(--auth-max)",
} as const;
