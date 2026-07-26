import type {
  AiCategory,
  AiPillar,
  AiUrgency,
  RawHit,
} from "@/modules/ai-intel/types";

const URGENT_RE =
  /\b(deprecat|sunset|retir|ban(ned)?|outage|breaking|security|critical|shutdown|removed)\b/i;
const PRICING_RE = /\b(pric(e|ing)|cost|\$|€|token\s*price|rate\s*limit)\b/i;
const MODEL_RE =
  /\b(model|llm|gpt|claude|gemini|llama|mistral|deepseek|grok|opus|sonnet|haiku|frontier)\b/i;
const TOOL_RE =
  /\b(ide|cursor|copilot|windsurf|cli|mcp|sdk|agent|workflow|devtools?)\b/i;
const OSS_RE =
  /\b(github|repo|open[\s-]?source|library|stars?|trending|release|npm|pypi)\b/i;
const WORLD_RE =
  /\b(regulat|policy|ban|government|china|eu ai act|congress|trump|law|court|country|geopolit)/i;

export function classifyHit(
  hit: RawHit,
  pillarHints: AiPillar[] = [],
): { pillar: AiPillar; category: AiCategory; urgency: AiUrgency } {
  const text = `${hit.title} ${hit.summary}`;

  let urgency: AiUrgency = "light";
  if (URGENT_RE.test(text)) urgency = "urgent";
  else if (PRICING_RE.test(text) || MODEL_RE.test(text) || TOOL_RE.test(text)) {
    urgency = "medium";
  }

  let pillar: AiPillar =
    pillarHints[0] ??
    (WORLD_RE.test(text)
      ? "world"
      : OSS_RE.test(text) && !MODEL_RE.test(text)
        ? "opensource"
        : TOOL_RE.test(text) && !MODEL_RE.test(text)
          ? "tools"
          : MODEL_RE.test(text)
            ? "models"
            : pillarHints[0] ?? "tools");

  if (WORLD_RE.test(text)) pillar = "world";
  else if (pillarHints.includes("opensource") && /github|repo|stars?/i.test(text)) {
    pillar = "opensource";
  }

  let category: AiCategory = "general";
  if (pillar === "models") {
    if (/deprecat|sunset|retir/i.test(text)) category = "deprecation";
    else if (PRICING_RE.test(text)) category = "pricing";
    else if (/context|window|token|capacity/i.test(text)) category = "capacity";
    else if (/upgrade|update|v\d|version/i.test(text)) category = "upgrade";
    else category = "new_model";
  } else if (pillar === "tools") {
    if (/\bmcp\b/i.test(text)) category = "mcp";
    else if (/\bcli\b/i.test(text)) category = "cli";
    else if (/\bsdk\b/i.test(text)) category = "sdk";
    else if (/ide|cursor|copilot|windsurf/i.test(text)) category = "ide";
    else category = "software";
  } else if (pillar === "opensource") {
    if (/trending|stars?/i.test(text)) category = "trending_repo";
    else if (/release|v\d/i.test(text)) category = "release";
    else category = "library";
  } else {
    if (/\bban/i.test(text)) category = "ban";
    else if (/regulat|ai act/i.test(text)) category = "regulation";
    else if (/policy|law|government/i.test(text)) category = "policy";
    else category = "country";
  }

  return { pillar, category, urgency };
}
