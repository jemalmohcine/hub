import { addDaysIso, formatDate, toDayKey, toDate } from "~/shared/lib/dates";

/** Human section title for a feed_date (YYYY-MM-DD). */
export function feedDayGroupLabel(feedDate: string, today = toDayKey(new Date())): string {
  if (!feedDate) return "";
  const yesterday = addDaysIso(today, -1);
  if (feedDate === today) return "Aujourd'hui";
  if (feedDate === yesterday) return "Hier";
  const date = toDate(`${feedDate}T12:00:00`);
  if (!date) return feedDate;
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const rest = formatDate(date, "fr", "dayMonthYear");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${rest}`;
}
