export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith("/app") || to.path === "/admin") {
    setPageLayout("app");
  }
});
