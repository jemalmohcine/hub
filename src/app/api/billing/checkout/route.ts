import { getHubUser } from "@/core/auth/get-user";
import { getPaymentProvider } from "@/core/billing";
import { NextResponse } from "next/server";
import type { PlanId } from "@/core/auth/types";

export async function POST(request: Request) {
  const user = await getHubUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { planId?: PlanId };
  const planId = body.planId ?? "pro";
  const provider = getPaymentProvider();
  const result = await provider.createCheckout(user.id, planId);

  return NextResponse.json({ provider: provider.id, result });
}
