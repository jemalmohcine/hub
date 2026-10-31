import { MockPaymentProvider } from "@/core/billing/mock-provider";
import type { PaymentProvider } from "@/core/billing/types";

let provider: PaymentProvider | null = null;

/**
 * Resolve the active payment provider.
 * Swap implementation here when integrating Stripe / Lemon Squeezy / Paddle.
 */
export function getPaymentProvider(): PaymentProvider {
  if (!provider) {
    provider = new MockPaymentProvider();
  }
  return provider;
}
