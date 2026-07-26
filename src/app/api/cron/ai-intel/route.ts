import { NextResponse } from "next/server";
import { runAiIntelIngest } from "@/modules/ai-intel/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  // Vercel Cron sends this header when CRON_SECRET is configured
  const cronHeader = req.headers.get("x-vercel-cron-secret");
  if (cronHeader && cronHeader === secret) return true;
  return false;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAiIntelIngest();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Allow Vercel Cron GET pings
  return POST(req);
}
