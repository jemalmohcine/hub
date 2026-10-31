import type { PlanId } from "@/core/auth/types";

export type CheckoutResult =
  | { url: string }
  | { deferred: true; message: string };

export type PortalResult =
  | { url: string }
  | { unsupported: true; message: string };

export interface PaymentProvider {
  readonly id: string;
  createCheckout(userId: string, planId: PlanId): Promise<CheckoutResult>;
  createPortal(userId: string): Promise<PortalResult>;
  syncSubscription(payload: unknown): Promise<void>;
}
