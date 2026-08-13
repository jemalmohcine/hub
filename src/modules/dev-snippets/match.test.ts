import { describe, expect, it } from "vitest";
import {
  mergeRankedIds,
  rankSnippets,
  scoreSnippet,
  tokenizeQuery,
  type SnippetSearchItem,
} from "@/modules/dev-snippets/match";

function snippet(overrides: Partial<SnippetSearchItem> & { id: string }): SnippetSearchItem {
  return {
    title: "",
    kind: "snippet",
    language: null,
    content: "",
    tags: [],
    ...overrides,
  };
}

describe("tokenizeQuery", () => {
  it("drops punctuation and short tokens", () => {
    expect(tokenizeQuery("Docker, healthcheck!")).toEqual(["docker", "healthcheck"]);
  });
});

describe("scoreSnippet", () => {
  it("finds docker in the title", () => {
    const item = snippet({
      id: "1",
      title: "Docker healthcheck PostgreSQL",
      content: "HEALTHCHECK CMD pg_isready",
      tags: ["devops"],
    });
    expect(scoreSnippet("docker", item)).toBeGreaterThan(0);
  });

  it("finds a word that only appears in the body", () => {
    const item = snippet({
      id: "2",
      title: "Compose local",
      content: "services:\n  db:\n    image: postgres:16",
      language: "yaml",
    });
    expect(scoreSnippet("postgres", item)).toBeGreaterThan(0);
  });

  it("treats js as javascript", () => {
    const item = snippet({
      id: "3",
      title: "Fetch timeout",
      kind: "note",
      language: "javascript",
      content: "AbortSignal.timeout(5_000)",
    });
    expect(scoreSnippet("js", item)).toBeGreaterThan(0);
  });

  it("returns 0 when nothing overlaps", () => {
    const item = snippet({
      id: "4",
      title: "CSS grid cheatsheet",
      language: "css",
      content: "display: grid",
    });
    expect(scoreSnippet("docker", item)).toBe(0);
  });
});

describe("rankSnippets", () => {
  it("puts the closer match first", () => {
    const docker = snippet({
      id: "docker",
      title: "Docker healthcheck",
      tags: ["docker"],
      content: "HEALTHCHECK CMD",
    });
    const other = snippet({
      id: "other",
      title: "Nginx reverse proxy",
      content: "proxy_pass http://app",
    });
    expect(rankSnippets("docker", [other, docker]).map((item) => item.id)).toEqual([
      "docker",
    ]);
  });
});

describe("mergeRankedIds", () => {
  it("keeps AI order then leftover local hits", () => {
    expect(
      mergeRankedIds(["b", "a"], ["a", "c"], new Set(["a", "b", "c"])),
    ).toEqual(["b", "a", "c"]);
  });

  it("drops unknown ids from the model", () => {
    expect(mergeRankedIds(["ghost", "a"], ["a"], new Set(["a"]))).toEqual(["a"]);
  });
});
