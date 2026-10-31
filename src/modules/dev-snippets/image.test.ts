import { describe, expect, it } from "vitest";
import { normalizeSnippetImage } from "@/modules/dev-snippets/image";

describe("normalizeSnippetImage", () => {
  it("treats blank as no image", () => {
    expect(normalizeSnippetImage("")).toBeNull();
    expect(normalizeSnippetImage("   ")).toBeNull();
    expect(normalizeSnippetImage(null)).toBeNull();
  });

  it("keeps an https URL", () => {
    expect(normalizeSnippetImage("https://cdn.example.com/shot.png")).toBe(
      "https://cdn.example.com/shot.png",
    );
  });

  it("rejects a non-http scheme", () => {
    expect(() => normalizeSnippetImage("javascript:alert(1)")).toThrow();
  });

  it("keeps a jpeg data URL", () => {
    const value = "data:image/jpeg;base64,/9j/4AAQ";
    expect(normalizeSnippetImage(value)).toBe(value);
  });

  it("rejects a non-image data URL", () => {
    expect(() =>
      normalizeSnippetImage("data:text/plain;base64,aGVsbG8="),
    ).toThrow();
  });
});
