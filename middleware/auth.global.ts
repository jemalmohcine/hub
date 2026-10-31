export default defineNuxtRouteMiddleware(async (to) => {
  if (
    to.path === "/" ||
    to.path.startsWith("/auth") ||
    to.path.startsWith("/api")
  ) {
    return;
  }
  if (!to.path.startsWith("/app")) return;

  if (import.meta.client) {
    await restoreClientSession();
  }

  const user = useSupabaseUser();
  if (!user.value) {
    return navigateTo(`/auth/login?next=${encodeURIComponent(to.fullPath)}`);
  }
});
