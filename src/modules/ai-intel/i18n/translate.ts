const cache = new Map<string, string>();

function cacheKey(text: string, from: string, to: string) {
  return `${from}|${to}|${text.slice(0, 240)}`;
}

/** Free MyMemory translate — best-effort, used once then stored in metadata. */
export async function translateOnce(
  text: string,
  from: "en" | "fr",
  to: "en" | "fr",
): Promise<string | null> {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed || from === to) return trimmed;

  const key = cacheKey(trimmed, from, to);
  const hit = cache.get(key);
  if (hit) return hit;

  // Keep payloads small for free tier
  const chunk = trimmed.slice(0, 450);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${from}|${to}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const out = data.responseData?.translatedText?.trim();
    if (!out || /MYMEMORY WARNING/i.test(out)) return null;
    cache.set(key, out);
    return out;
  } catch {
    return null;
  }
}

export async function translateFields(
  fields: Record<string, string | null | undefined>,
  from: "en" | "fr",
  to: "en" | "fr",
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!v?.trim()) continue;
    const translated = await translateOnce(v, from, to);
    if (translated) out[k] = translated;
  }
  return out;
}
