import { describe, expect, it } from "vitest";
import { defaultCvDocument } from "@/modules/cv-builder/defaults";
import { buildCvHtml, exportCvPdf } from "@/modules/cv-builder/export";

describe("buildCvHtml", () => {
  it("renders the profile name in a printable document", () => {
    const doc = defaultCvDocument();
    doc.profile.fullName = "Jemal mohcine";
    const html = buildCvHtml(doc);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("Jemal mohcine");
    expect(html).toContain("@page");
  });
});

describe("exportCvPdf", () => {
  it("does not rely on window.open", () => {
    expect(exportCvPdf(defaultCvDocument())).toBe(false);
  });
});
