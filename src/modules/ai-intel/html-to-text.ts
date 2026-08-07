/** Decode common HTML entities (including double-encoded fragments from READMEs). */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}

/** Strip HTML tags, markdown noise, and collapse whitespace to plain text. */
export function stripHtmlAndMarkdown(text: string): string {
  let s = decodeHtmlEntities(text);
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
  s = s.replace(/<(script|style|nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|li|h[1-6]|div|section|article|tr)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/!\[[^\]]*\]\([^)]+\)/g, " ");
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  s = s.replace(/`{1,3}[^`]+`{1,3}/g, " ");
  s = s.replace(/[#>*_~|]/g, " ");
  s = s.replace(/\s+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/[ \t]{2,}/g, " ");
  return s.trim();
}

/** True when text still looks like markup, a URL dump, or README boilerplate. */
export function isGarbageText(text: string): boolean {
  const value = text.trim();
  if (!value) return true;
  if (/<[a-z][\s>]/i.test(value)) return true;
  if (/&lt;|&gt;|&amp;|align\s*=\s*["']/i.test(value)) return true;
  if (/^h[1-6]\s/i.test(value)) return true;
  if (/https?:\/\/[^\s]{50,}/i.test(value) && value.length < 120) return true;
  if (/^(build status|codecov|table of contents)/i.test(value)) return true;
  return false;
}

/** Safe plain text for UI and translation — empty when content is unusable. */
export function sanitizePlainText(text: string, max = 2000): string {
  const clean = stripHtmlAndMarkdown(text);
  if (!clean || isGarbageText(clean)) return "";
  return clean.slice(0, max);
}

export function firstCleanClause(text: string, max = 120): string {
  const clean = sanitizePlainText(text, max * 2);
  if (!clean) return "";
  const clause = clean.split(/(?<=[.!?])\s+/)[0]?.trim() || clean;
  if (clause.length <= max) return clause;
  return `${clause.slice(0, max - 1).trim()}…`;
}
