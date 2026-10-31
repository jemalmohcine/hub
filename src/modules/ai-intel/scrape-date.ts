/**
 * Calendar day the digest belongs to.
 *
 * Stored as UTC noon so Europe/Africa local dates stay on that same day
 * (UTC noon is 13:00–14:00 in Paris, 13:00 in Morocco).
 *
 * The GitHub Action runs every 3 hours. UTC noon keeps Europe/Africa on the
 * same calendar day as the scrape.
 */
export function scrapeDayIso(at: Date = new Date()): string {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 12, 0, 0),
  ).toISOString();
}
