export default defineNuxtRouteMiddleware(async (to) => {
  if (
    to.path === "/" ||
    to.path.startsWith("/auth") ||
    to.path.startsWith("/api") ||
    to.path === "/sign-in" ||
    to.path === "/sign-up"
  ) {
    return;
  }
  if (!to.path.startsWith("/app") && to.path !== "/admin") return;

  const config = useRuntimeConfig();
  if (config.public.e2eShell && to.path === "/app/playwright-fixture") return;

  if (import.meta.server) return;

  await restoreClientSession();
  const user = useSupabaseUser();
  if (!user.value) {
    return navigateTo(`/auth/login?next=${encodeURIComponent(to.fullPath)}`);
  }
});
