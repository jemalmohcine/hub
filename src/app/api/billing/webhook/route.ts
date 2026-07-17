import { getPaymentProvider } from "@/core/billing";
import { NextResponse } from "next/server";

/** Webhook stub — wire real PSP signature verification when integrating. */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  const payload = await request.json().catch(() => ({}));
  await provider.syncSubscription(payload);
  return NextResponse.json({
    ok: true,
    provider: provider.id,
    message: "Webhook received (stub). No provider synced yet.",
  });
}
