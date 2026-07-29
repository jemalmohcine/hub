import { fetchJson } from "@/modules/ai-intel/collectors/fetch";
import type { RawHit } from "@/modules/ai-intel/types";

type HnHit = {
  objectID: string;
  title?: string;
  url?: string;
  story_url?: string;
  created_at?: string;
  points?: number;
};

type HnResponse = { hits?: HnHit[] };

export async function collectHackerNewsAi(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const data = await fetchJson<HnResponse>(url);
  return (data.hits ?? []).slice(0, 40).flatMap((h) => {
    const link = h.url || h.story_url;
    const title = h.title;
    if (!link || !title) return [];
    return [
      {
        title,
        summary: h.points != null ? `${h.points} points on HN` : "",
        url: link,
        sourceId,
        externalId: h.objectID,
        publishedAt: h.created_at
          ? new Date(h.created_at).toISOString()
          : null,
      },
    ];
  });
}

type TldrItem = {
  title?: string;
  url?: string;
  link?: string;
  summary?: string;
  content?: string;
  date?: string;
  published_at?: string;
};

export async function collectTldrAi(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const data = await fetchJson<unknown>(url);
  const list: TldrItem[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { articles?: TldrItem[] }).articles)
      ? ((data as { articles: TldrItem[] }).articles)
      : Array.isArray((data as { data?: TldrItem[] }).data)
        ? ((data as { data: TldrItem[] }).data)
        : [];

  return list.slice(0, 40).flatMap((item) => {
    const link = item.url || item.link;
    const title = item.title;
    if (!link || !title) return [];
    const published = item.published_at || item.date || null;
    return [
      {
        title,
        summary: (item.summary || item.content || "").slice(0, 500),
        url: link,
        sourceId,
        externalId: link,
        publishedAt: published ? new Date(published).toISOString() : null,
      },
    ];
  });
}
