/**
 * iOS standalone PWAs report a "lying" viewport: `100dvh`, `innerHeight` and
 * `position: fixed; inset: 0` all stop above the home-indicator strip, and
 * `env(safe-area-inset-bottom)` is 0 (WebKit bug 254868). The unpainted strip
 * shows through as a black bar. Measure the real gap so the shell can fill it.
 */

export type ViewportProbe = {
  innerHeight: number;
  screen: { height: number };
  visualViewport: { height: number } | null;
  navigator: { standalone?: boolean };
  matchMedia: (query: string) => { matches: boolean };
};

export function isStandaloneDisplay(probe: ViewportProbe): boolean {
  return (
    Boolean(probe.navigator.standalone) ||
    probe.matchMedia("(display-mode: standalone)").matches
  );
}

/** Home-indicator strip is ~34px; ignore subpixels and split-view outliers. */
const MIN_GAP_PX = 3;
const MAX_GAP_PX = 96;

export function measureIosPwaBottomGap(probe: ViewportProbe): number {
  if (!isStandaloneDisplay(probe)) return 0;

  const viewportH = Math.round(probe.visualViewport?.height ?? probe.innerHeight);
  const gap = Math.round(probe.screen.height) - viewportH;
  if (gap < MIN_GAP_PX || gap > MAX_GAP_PX) return 0;
  return gap;
}

export function probeFromWindow(win: Window): ViewportProbe {
  return {
    innerHeight: win.innerHeight,
    screen: { height: win.screen.height },
    visualViewport: win.visualViewport
      ? { height: win.visualViewport.height }
      : null,
    navigator: { standalone: (win.navigator as Navigator & { standalone?: boolean }).standalone },
    matchMedia: (query: string) => win.matchMedia(query),
  };
}
