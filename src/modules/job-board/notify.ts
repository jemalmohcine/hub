import { createAdminClient } from "@/core/auth/supabase/admin";
import { daysBetween, toDayKey } from "@/lib/dates";
import { rankListingsForPrefs } from "@/modules/job-board/fit";
import { hasActiveJobFilters } from "@/modules/job-board/filters";
import { prefsFromDbRow, listingFromRow } from "@/modules/job-board/queries";
import type { JobListing } from "@/modules/job-board/types";
import { createNotification } from "@/modules/notifications/create";

const FRESH_HOURS = 8;
const MAX_USERS = 80;

export function newMatchesCopy(count: number, roleQuery: string): { title: string; body: string } {
  const label = roleQuery.trim() || "ta recherche";
  return {
    title:
      count === 1 ? "Une nouvelle offre pour toi" : `${count} nouvelles offres pour toi`,
    body: `Elles collent à ${label}. Ouvre Offres pour postuler ou suivre.`,
  };
}

export function followUpCopy(count: number): { title: string; body: string } {
  return {
    title: count === 1 ? "Une relance aujourd’hui" : `${count} relances aujourd’hui`,
    body: "À postuler ou à relancer. Deux minutes, puis c’est fait.",
  };
}

export function isFreshListing(listing: Pick<JobListing, "scrapedAt">, now = Date.now()): boolean {
  const t = Date.parse(listing.scrapedAt);
  if (!Number.isFinite(t)) return false;
  return now - t <= FRESH_HOURS * 3_600_000;
}

type PrefsRow = {
  user_id: string;
  role_query: string;
  city: string;
  work_mode: string;
  locations?: string[] | null;
  roles?: string[] | null;
  work_modes?: string[] | null;
  filters?: unknown;
};

async function notifyNewMatches(listings: JobListing[], day: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_search_prefs")
    .select("user_id, role_query, city, work_mode, locations, roles, work_modes, filters")
    .limit(MAX_USERS);
  if (error || !data) return 0;

  let sent = 0;
  for (const row of data as PrefsRow[]) {
    const prefs = prefsFromDbRow(row);
    if (!hasActiveJobFilters(prefs)) continue;
    const ranked = rankListingsForPrefs(listings, prefs);
    const fresh = ranked.filter((listing) => isFreshListing(listing)).length;
    if (fresh < 1) continue;
    const copy = newMatchesCopy(fresh, prefs.roleQuery);
    try {
      await createNotification({
        userId: row.user_id,
        category: "jobs",
        title: copy.title,
        body: copy.body,
        href: "/app/career?tab=offers",
        severity: "info",
        dedupeKey: `jobs:matches:${row.user_id}:${day}`,
        skipPush: true,
      });
      sent += 1;
    } catch {
      // category column may not include jobs yet
    }
  }
  return sent;
}

async function notifyFollowUps(day: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_applications")
    .select("user_id")
    .lte("follow_up_at", day)
    .in("status", ["to_apply", "applied"]);
  if (error || !data) return 0;

  const counts = new Map<string, number>();
  for (const row of data as Array<{ user_id: string }>) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  let sent = 0;
  for (const [userId, count] of counts) {
    const copy = followUpCopy(count);
    try {
      await createNotification({
        userId,
        category: "jobs",
        title: copy.title,
        body: copy.body,
        href: "/app/career?tab=jobs",
        severity: "warning",
        dedupeKey: `jobs:followup:${userId}:${day}`,
        skipPush: true,
      });
      sent += 1;
    } catch {
      // optional until migration applied
    }
  }
  return sent;
}

export async function notifyJobBoardUsers(now = Date.now()) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_listings")
    .select("*")
    .order("scraped_at", { ascending: false })
    .limit(500);
  const listings = error || !data ? [] : (data as Parameters<typeof listingFromRow>[0][]).map(listingFromRow);
  const day = toDayKey(now);
  const matches = await notifyNewMatches(listings, day);
  const followUps = await notifyFollowUps(day);
  console.info("[jobs] notify", { matches, followUps, ageDaysSample: listings[0] ? daysBetween(listings[0].scrapedAt, now) : null });
  return { matches, followUps };
}
