import type { NextConfig } from "next";

function env(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

const supabaseUrl =
  env("NEXT_PUBLIC_SUPABASE_URL") ?? env("NUXT_PUBLIC_SUPABASE_URL");
const supabaseAnon =
  env("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? env("NUXT_PUBLIC_SUPABASE_ANON_KEY");
const appUrl = env("NEXT_PUBLIC_APP_URL") ?? env("NUXT_PUBLIC_APP_URL");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnon,
    NEXT_PUBLIC_APP_URL: appUrl,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/auth/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/auth/login", destination: "/sign-in", permanent: true },
      { source: "/auth/sign-up", destination: "/sign-up", permanent: true },
      { source: "/auth/confirm", destination: "/auth/callback", permanent: false },
    ];
  },
};

export default nextConfig;
