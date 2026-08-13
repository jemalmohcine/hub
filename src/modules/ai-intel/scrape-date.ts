/**
 * Calendar day the digest belongs to.
 *
 * Stored as UTC noon so Europe/Africa local dates stay on that same day
 * (UTC noon is 13:00–14:00 in Paris, 13:00 in Morocco).
 *
 * The GitHub Action runs at 06:00 UTC (08:00 Paris in summer): late enough
 * that GitHub "stars today" has real volume, early enough that "Aujourd’hui"
 * still matches when the user opens the app in the morning.
 */
export function scrapeDayIso(at: Date = new Date()): string {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 12, 0, 0),
  ).toISOString();
}
