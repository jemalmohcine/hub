import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  modules: ["@nuxtjs/supabase", "@vueuse/nuxt"],
  supabase: {
    redirect: false,
  },
  runtimeConfig: {
    veilleIngestSecret: process.env.VEILLE_INGEST_SECRET || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || "http://localhost:3000",
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || "",
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || "",
    },
  },
  nitro: {
    preset: "vercel",
    routeRules: {
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
      title: "DevHub",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Hub dev personnel — veille IA, snippets, CV, offres gratuites.",
        },
      ],
    },
  },
});
