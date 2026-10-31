import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  if (
    path.startsWith("/api") ||
    path.startsWith("/auth") ||
    path === "/" ||
    path === "/sign-in" ||
    path === "/sign-up" ||
    path.startsWith("/_nuxt") ||
    path.startsWith("/icons") ||
    path === "/manifest.webmanifest" ||
    path === "/sw.js"
  ) {
    return;
  }

  if (!path.startsWith("/app") && path !== "/admin") return;

  const user = await serverSupabaseUser(event);
  if (!user) {
    const next = encodeURIComponent(path + (getRequestURL(event).search || ""));
    return sendRedirect(event, `/auth/login?next=${next}`, 302);
  }
});
