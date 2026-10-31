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

  if (import.meta.server) return;

  await restoreClientSession();
  const user = useSupabaseUser();
  if (!user.value) {
    return navigateTo(`/auth/login?next=${encodeURIComponent(to.fullPath)}`);
  }
});
