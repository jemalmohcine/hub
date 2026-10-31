import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  modules: ["@nuxtjs/supabase", "@vueuse/nuxt"],
  supabase: {
    redirect: false,
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    redirectOptions: {
      login: "/auth/login",
      callback: "/auth/confirm",
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 400,
      sameSite: "lax",
      secure: true,
    },
  },
  runtimeConfig: {
    veilleIngestSecret: process.env.VEILLE_INGEST_SECRET || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || "http://localhost:3000",
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || "",
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || "",
      vapidPublicKey:
        process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    },
  },
  nitro: {
    preset: "vercel",
    routeRules: {
      "/sign-in": { redirect: { to: "/auth/login", statusCode: 301 } },
      "/sign-up": { redirect: { to: "/auth/sign-up", statusCode: 301 } },
      "/reset-password": { redirect: { to: "/auth/update-password", statusCode: 301 } },
      "/app/profil": { redirect: { to: "/app/career", statusCode: 301 } },
      "/app/profil/**": { redirect: { to: "/app/career", statusCode: 301 } },
      "/app/cv": { redirect: { to: "/app/career?tab=cv", statusCode: 301 } },
      "/app/jobs": { redirect: { to: "/app/career?tab=jobs", statusCode: 301 } },
      "/app/offres": { redirect: { to: "/app/expenses?tab=tools", statusCode: 301 } },
      "/app/offres/**": { redirect: { to: "/app/expenses?tab=tools", statusCode: 301 } },
      "/auth/confirm": { ssr: false },
      "/auth/update-password": { ssr: false },
      "/**": {
        headers: {
          "X-Frame-Options": "DENY",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
          "Content-Security-Policy":
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
        },
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      title: "hub",
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
        },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "icon", href: "/icons/icon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/icons/icon-192x192.png" },
      ],
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        {
          name: "description",
          content: "hub. Veille IA, CV, candidatures, snippets et budget outils pour développeurs.",
        },
        { name: "theme-color", content: "#0c0a1f" },
      ],
    },
  },
});
