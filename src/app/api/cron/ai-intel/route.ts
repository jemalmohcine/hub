import { NextResponse } from "next/server";
import { backfillAiIntelI18n } from "@/modules/ai-intel/backfill-i18n";
import { runAiIntelIngest } from "@/modules/ai-intel/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Manual / local trigger only.
 * Production ingest runs in GitHub Actions (`.github/workflows/ai-intel-ingest.yml`)
 * on every push to `main` and every 3 hours — not via Vercel Cron.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "full";

  try {
    if (mode === "i18n") {
      const result = await backfillAiIntelI18n(150);
      return NextResponse.json({ ok: true, mode: "i18n", ...result });
    }

    const result = await runAiIntelIngest();
    // After scrape, refresh bilingual fields on latest rows
    const i18n = await backfillAiIntelI18n(80).catch(() => null);
    return NextResponse.json({ ok: true, mode: "full", ...result, i18n });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
