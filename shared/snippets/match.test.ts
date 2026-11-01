import { describe, expect, it } from "vitest";
import { rankSnippets } from "./match";

const items = [
  {
    id: "a",
    title: "React hook",
    kind: "snippet",
    language: "typescript",
    content: "useEffect(() => {}, [])",
    tags: ["react"],
  },
  {
    id: "b",
    title: "SQL index",
    kind: "snippet",
    language: "sql",
    content: "create index on users(email)",
    tags: ["postgres"],
  },
];

describe("rankSnippets", () => {
  it("returns all items when query is empty", () => {
    expect(rankSnippets("", items)).toHaveLength(2);
  });

  it("filters and orders by query (query first, items second)", () => {
    const ranked = rankSnippets("react", items);
    expect(ranked.map((i) => i.id)).toEqual(["a"]);
  });
});
