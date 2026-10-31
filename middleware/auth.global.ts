export default defineNuxtRouteMiddleware(async (to) => {
  if (
    to.path === "/" ||
    to.path.startsWith("/auth") ||
    to.path.startsWith("/api")
  ) {
    return;
  }
  if (!to.path.startsWith("/app")) return;

  await syncSupabaseAuthState();

  const authUserId = useAuthUserId();
  if (authUserId.value) return;

  if (import.meta.server) {
    if (likelyAuthenticatedButPending()) {
      return;
    }
    return;
  }

  await restoreClientSession();
  if (!useAuthUserId().value) {
    return navigateTo(`/auth/login?next=${encodeURIComponent(to.fullPath)}`);
  }
});
