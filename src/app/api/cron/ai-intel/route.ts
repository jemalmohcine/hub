import { NextResponse } from "next/server";
import { backfillAiIntelI18n } from "@/modules/ai-intel/backfill-i18n";
import { runAiIntelIngest } from "@/modules/ai-intel/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const cronHeader = req.headers.get("x-vercel-cron-secret");
  if (cronHeader && cronHeader === secret) return true;
  return false;
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
