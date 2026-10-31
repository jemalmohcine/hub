import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
export const DEFAULT_GATEWAY_MODEL = "google/gemini-3.6-flash";

export type ResolvedModel = { model: LanguageModel; label: string };

export function hasGoogleFreeApiKey(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY);
}

export function hasAiGateway(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

export function isLlmAvailable(): boolean {
  return hasGoogleFreeApiKey() || hasAiGateway();
}

export function resolveLlmModel(configured?: string | null): ResolvedModel {
  const requested = (configured || "").trim();

  if (hasGoogleFreeApiKey()) {
    const modelId = requested.includes("/")
      ? requested.split("/").pop() || DEFAULT_GEMINI_MODEL
      : requested || DEFAULT_GEMINI_MODEL;
    return { model: google(modelId), label: modelId };
  }

  const gatewayModel = requested || DEFAULT_GATEWAY_MODEL;
  return { model: gatewayModel, label: gatewayModel };
}

export function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /\b429\b|rate.?limit|RESOURCE_EXHAUSTED|quota|too many requests/i.test(message);
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
