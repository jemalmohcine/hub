import { describe, expect, it } from "vitest";
import { absoluteUrl, siteOrigin } from "@/lib/site";

describe("siteOrigin", () => {
  it("returns a URL origin without a path", () => {
    expect(siteOrigin()).toMatch(/^https?:\/\//);
    expect(siteOrigin().endsWith("/")).toBe(false);
  });
});

describe("absoluteUrl", () => {
  it("joins the origin and a path", () => {
    expect(absoluteUrl("/sign-up")).toBe(`${siteOrigin()}/sign-up`);
  });

  it("normalizes the home URL", () => {
    expect(absoluteUrl("/")).toBe(`${siteOrigin()}/`);
  });
});
