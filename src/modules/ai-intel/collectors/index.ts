import {
  collectHackerNewsAi,
  collectTldrAi,
} from "@/modules/ai-intel/collectors/api";
import {
  collectFutureTools,
  collectGenericHtmlList,
  collectGithubTrending,
  collectGitTrend,
} from "@/modules/ai-intel/collectors/html";
import { collectRss } from "@/modules/ai-intel/collectors/rss";
import type { AiIntelSource, RawHit } from "@/modules/ai-intel/types";

export async function collectFromSource(
  source: AiIntelSource,
): Promise<RawHit[]> {
  switch (source.id) {
    case "gittrend":
      return collectGitTrend(source.id, source.url);
    case "futuretools":
      return collectFutureTools(source.id, source.url);
    case "github-trending":
      return collectGithubTrending(source.id, source.url);
    case "hn-ai":
      return collectHackerNewsAi(source.id, source.url);
    case "tldr-ai":
      return collectTldrAi(source.id, source.url);
    default:
      if (source.kind === "rss") return collectRss(source.id, source.url);
      if (source.kind === "api") {
        // Generic JSON list attempt via HN-like or TLDR-like shapes
        try {
          return await collectTldrAi(source.id, source.url);
        } catch {
          return collectHackerNewsAi(source.id, source.url);
        }
      }
      return collectGenericHtmlList(source.id, source.url);
  }
}
