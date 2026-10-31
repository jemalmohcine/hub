import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { upsertVeilleItems } from "@/modules/ai-intel/veille/ingest";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.VEILLE_INGEST_SECRET;
  if (!secret) return false;
  return req.headers.get("x-ingest-secret") === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await upsertVeilleItems(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: err.flatten() },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
