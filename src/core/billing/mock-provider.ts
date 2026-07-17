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
    userId: string,
    planId: PlanId,
  ): Promise<CheckoutResult> {
    void userId;
    return {
      deferred: true,
      message: `Mock checkout for plan "${planId}". Use the in-app upgrade action.`,
    };
  }

  async createPortal(userId: string): Promise<PortalResult> {
    void userId;
    return {
      unsupported: true,
      message:
        "Customer portal will be available once a payment provider is connected.",
    };
  }

  async syncSubscription(payload: unknown): Promise<void> {
    void payload;
    // Webhook stub — real providers will implement this.
  }
}
