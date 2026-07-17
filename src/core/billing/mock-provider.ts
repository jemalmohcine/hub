import type { PlanId } from "@/core/auth/types";
import type {
  CheckoutResult,
  PaymentProvider,
  PortalResult,
} from "@/core/billing/types";

/**
 * Mock provider for Phase 1 — no Stripe/Lemon/etc.
 * Checkout is deferred; the app upgrades via server action against Supabase.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly id = "mock";

  async createCheckout(
    _userId: string,
    planId: PlanId,
  ): Promise<CheckoutResult> {
    return {
      deferred: true,
      message: `Mock checkout for plan "${planId}". Use the in-app upgrade action.`,
    };
  }

  async createPortal(_userId: string): Promise<PortalResult> {
    return {
      unsupported: true,
      message:
        "Customer portal will be available once a payment provider is connected.",
    };
  }

  async syncSubscription(_payload: unknown): Promise<void> {
    // Webhook stub — real providers will implement this.
  }
}
