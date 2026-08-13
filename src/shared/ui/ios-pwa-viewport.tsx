"use client";

import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";
import {
  measureIosPwaBottomGap,
  probeFromWindow,
} from "@/lib/viewport/ios-pwa-gap";

const THEME_COLOR = {
  dark: "#1a2030",
  light: "#ffffff",
} as const;

function applyThemeColor(resolved: string | undefined) {
  const color = resolved === "light" ? THEME_COLOR.light : THEME_COLOR.dark;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}

function applyBottomGap() {
  const gap = measureIosPwaBottomGap(probeFromWindow(window));
  const root = document.documentElement;
  if (gap > 0) {
    root.style.setProperty("--ios-pwa-bottom-gap", `${gap}px`);
  } else {
    root.style.removeProperty("--ios-pwa-bottom-gap");
  }
}

/**
 * Compensates for the iOS standalone PWA lying viewport and keeps theme-color
 * in sync so the home-indicator chrome is not painted black.
 */
export function IosPwaViewport() {
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    applyBottomGap();
    applyThemeColor(resolvedTheme);

    const onResize = () => applyBottomGap();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [resolvedTheme]);

  return null;
}
