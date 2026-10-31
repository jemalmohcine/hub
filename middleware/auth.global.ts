export default defineNuxtRouteMiddleware((to) => {
  if (
    to.path === "/" ||
    to.path.startsWith("/auth") ||
    to.path.startsWith("/api")
  ) {
    return;
  }
  if (!to.path.startsWith("/app")) return;
  const user = useSupabaseUser();
  if (!user.value) {
    return navigateTo(`/auth/login?next=${encodeURIComponent(to.fullPath)}`);
  }
});
