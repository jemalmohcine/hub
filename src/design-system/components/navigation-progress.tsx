"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Top progress bar — appears on internal link click, hides when route settles.
 * Gives instant click feedback even when the destination is still loading.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Finish when navigation completes
  useEffect(() => {
    setActive(false);
    const hide = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(hide);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) {
        try {
          const url = new URL(href, window.location.origin);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }

      const next = new URL(href, window.location.href);
      const current = new URL(window.location.href);
      if (next.pathname === current.pathname && next.search === current.search) {
        return;
      }

      setVisible(true);
      setActive(true);
      if (timer.current) clearTimeout(timer.current);
      // Safety: never leave the bar stuck
      timer.current = setTimeout(() => {
        setActive(false);
        setVisible(false);
      }, 8000);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
      aria-hidden
    >
      <div
        className={cn(
          "h-full origin-left bg-primary transition-[transform,opacity] duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0",
          active ? "animate-nav-progress" : "scale-x-100",
        )}
      />
    </div>
  );
}
