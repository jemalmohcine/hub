import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import { IosPwaViewport } from "@/shared/ui/ios-pwa-viewport";
import { PwaRegister } from "@/shared/ui/pwa-register";
import {
  ConfirmProvider,
  NavigationProgress,
  ThemeProvider,
  ToastProvider,
} from "@/design-system";
import { SITE_DESCRIPTION, SITE_NAME, siteOrigin } from "@/lib/site";
import { cn } from "@/lib/utils";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} · veille IA, CV, candidatures et snippets`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "DevHub",
    "hub développeur",
    "veille IA",
    "CV développeur",
    "offres d’emploi dev",
    "snippets",
    "budget outils",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/icons/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  // iOS PWA ignores media-query theme-color and falls back to black chrome.
  themeColor: "#1a2030",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn("h-full antialiased", sora.variable, ibmPlexMono.variable)}
    >
      <body className="min-h-full font-sans">
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              {children}
              <IosPwaViewport />
              <PwaRegister />
            </ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
