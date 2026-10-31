/** Lightweight language guess for short AI news / tool blurbs. */
export function detectTextLang(text: string): "en" | "fr" | "unknown" {
  const sample = text.replace(/\s+/g, " ").trim().slice(0, 800);
  if (sample.length < 12) return "unknown";

  const frHits =
    (sample.match(
      /\b(le|la|les|des|une|est|pour|avec|dans|sur|pas|plus|être|aussi|cette|sont|outil|nouveau|nouvelle|développeur|aujourd)\b/gi,
    )?.length ?? 0) +
    (sample.match(/[àâäéèêëïîôùûüç]/gi)?.length ?? 0);

  const enHits =
    sample.match(
      /\b(the|and|for|with|from|this|that|new|tool|model|release|developer|today|about|into|your|their)\b/gi,
    )?.length ?? 0;

  if (frHits >= enHits + 2) return "fr";
  if (enHits >= frHits + 2) return "en";
  if (enHits > 0 && frHits === 0) return "en";
  if (frHits > 0 && enHits === 0) return "fr";
  return "unknown";
}
