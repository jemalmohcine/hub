import { describe, expect, it } from "vitest";
import {
  isStandaloneDisplay,
  measureIosPwaBottomGap,
  type ViewportProbe,
} from "@/lib/viewport/ios-pwa-gap";

function probe(overrides: Partial<ViewportProbe> & { standalone?: boolean } = {}): ViewportProbe {
  const standalone = overrides.standalone ?? false;
  return {
    innerHeight: 780,
    screen: { height: 844 },
    visualViewport: { height: 780 },
    navigator: { standalone },
    matchMedia: (query: string) => ({
      matches: query.includes("standalone") ? standalone : false,
    }),
    ...overrides,
  };
}

describe("isStandaloneDisplay", () => {
  it("detects navigator.standalone", () => {
    expect(isStandaloneDisplay(probe({ standalone: true }))).toBe(true);
  });

  it("detects display-mode media query", () => {
    const p = probe({
      standalone: false,
      matchMedia: (query) => ({ matches: query.includes("standalone") }),
    });
    expect(isStandaloneDisplay(p)).toBe(true);
  });

  it("is false in a normal browser tab", () => {
    expect(isStandaloneDisplay(probe({ standalone: false }))).toBe(false);
  });
});

describe("measureIosPwaBottomGap", () => {
  it("is 0 outside standalone so Safari chrome is not treated as a gap", () => {
    expect(measureIosPwaBottomGap(probe({ standalone: false }))).toBe(0);
  });

  it("returns the lying-viewport strip in an iPhone PWA", () => {
    expect(measureIosPwaBottomGap(probe({ standalone: true }))).toBe(64);
  });

  it("prefers visualViewport height when present", () => {
    expect(
      measureIosPwaBottomGap(
        probe({
          standalone: true,
          innerHeight: 800,
          visualViewport: { height: 810 },
          screen: { height: 844 },
        }),
      ),
    ).toBe(34);
  });

  it("ignores a missing or tiny gap", () => {
    expect(
      measureIosPwaBottomGap(
        probe({
          standalone: true,
          innerHeight: 844,
          visualViewport: { height: 844 },
          screen: { height: 844 },
        }),
      ),
    ).toBe(0);
  });

  it("ignores implausible gaps (landscape / split view)", () => {
    expect(
      measureIosPwaBottomGap(
        probe({
          standalone: true,
          innerHeight: 400,
          visualViewport: { height: 400 },
          screen: { height: 844 },
        }),
      ),
    ).toBe(0);
  });
});
