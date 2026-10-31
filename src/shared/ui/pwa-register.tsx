"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Always register in production; also when VAPID is set so push works on PWA builds.
    const allow =
      process.env.NODE_ENV === "production" ||
      Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
    if (!allow) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent fail — PWA is progressive enhancement
    });
  }, []);

  return null;
}
