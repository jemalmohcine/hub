/** UTC noon on the scrape calendar day — stable when shown in local timezones. */
export function scrapeDayIso(at: Date = new Date()): string {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 12, 0, 0),
  ).toISOString();
}
