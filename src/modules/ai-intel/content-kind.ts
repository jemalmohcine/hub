import type { HubLocale } from "@/core/i18n";
import type { AiIntelItem } from "@/modules/ai-intel/types";

/**
 * What the item actually is, so a dev knows in one glance:
 * repo GitHub, outil, fonctionnalité produit, modèle LLM, prix, breaking, sécurité, régulation, actu.
 */
export type ContentKind =
  | "repo"
  | "tool"
  | "feature"
  | "model"
  | "pricing"
  | "breaking"
  | "security"
  | "policy"
  | "news";

type ItemLike = Pick<
  AiIntelItem,
  "title" | "summary" | "pillar" | "category" | "metadata" | "primary_source"
>;

// Prefixes carry \w* because the trailing \b would otherwise reject the very
// words we are looking for ("vulnerability", "deprecated").
const SECURITY_RE =
  /\b(cve-?\d*|vulnerab\w*|security (advisory|patch|fix|issue|flaw)|exploit|zero[- ]day|data (leak|breach))\b/i;
const PRICING_RE =
  /\b(pricing|price (change|increase|cut|drop|hike)|subscription|per[- ]seat|now costs?|free tier|tarif|abonnement|paywall|billing change)\b/i;
const BREAKING_RE =
  /\b(deprecat\w*|sunset|end[- ]of[- ]life|\beol\b|breaking change|migration required|api change|shutting down|shutdown|discontinu\w*|removed support|retire[sd]?)\b/i;
const MODEL_RE =
  /\b(gpt-?[0-9o]|claude ?[0-9]|claude (opus|sonnet|haiku)|gemini ?[0-9.]+|llama[- ]?[0-9]|deepseek[- ]?[a-z0-9]*|mistral [a-z0-9]+|grok[- ]?[0-9]|new (llm|model)|model (release|launch|update)|frontier model|open[- ]weight)\b/i;
/**
 * Signals that the subject is a piece of software you run, not a hosted model.
 * Without this, a self-hosted Rust scraper landed on "Modèle LLM" purely
 * because the classifier had tagged the story `new_model`.
 */
const SOFTWARE_RE =
  /\b(open[- ]source|self[- ]host|drop[- ]in replacement|written in (rust|go|zig|c\+\+|typescript|python)|npm install|pip install|cargo|docker|\bcli\b|\bsdk\b|library|framework|repo(sitory)?|github\.com)\b/i;

const FEATURE_RE =
  /\b(now (available|supports?|in beta|generally available)|introduc(es|ing)|adds? (support|new)|new (feature|capability|integration)|launch(es|ed)?|integration|extension|plugin|now in beta|general availability|\bga\b|rolls? out|ships)\b/i;

/**
 * Vendor feeds only: the source *is* the product being announced.
 * Aggregators are deliberately absent — a Rust scraper posted on Hacker News
 * is not a "Hacker News" product, and labelling it as one misleads the reader.
 */
const SOURCE_PRODUCT: Record<string, string> = {
  "vercel-blog": "Vercel",
  "openai-blog": "OpenAI",
  "openai-changelog": "OpenAI",
  "anthropic-news": "Anthropic",
  "anthropic-changelog": "Anthropic",
  "google-ai-blog": "Google AI",
  "meta-ai-blog": "Meta AI",
  "huggingface-blog": "Hugging Face",
  "github-blog": "GitHub",
  "github-changelog": "GitHub",
  "cursor-changelog": "Cursor",
  "langchain-blog": "LangChain",
  "nvidia-dev-blog": "NVIDIA",
  "vscode-releases": "VS Code",
  "nextjs-releases": "Next.js",
};

const TITLE_PRODUCTS = [
  "Claude Code",
  "GitHub Copilot",
  "Copilot",
  "ChatGPT",
  "Claude",
  "Cursor",
  "Gemini",
  "VS Code",
  "Vercel",
  "Next.js",
  "Node.js",
  "OpenAI",
  "Anthropic",
  "Hugging Face",
  "LangChain",
  "Ollama",
  "DeepSeek",
  "Mistral",
  "Supabase",
  "Nuxt",
  "React",
] as const;

/** Product / company the item is about (e.g. "Vercel" for a Vercel blog post). */
export function productOf(item: ItemLike): string | null {
  const title = item.title || "";
  for (const product of TITLE_PRODUCTS) {
    const re = new RegExp(
      `(^|[^a-z])${product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`,
      "i",
    );
    if (re.test(title)) return product;
  }

  return SOURCE_PRODUCT[item.primary_source || ""] ?? null;
}

const CONTENT_KINDS = new Set<ContentKind>([
  "repo",
  "tool",
  "feature",
  "model",
  "pricing",
  "breaking",
  "security",
  "policy",
  "news",
]);

export function detectContentKind(item: ItemLike): ContentKind {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const text = `${item.title} ${item.summary ?? ""}`;
  const category = String(item.category || "");

  // Decided while reading the scraped content — more reliable than any regex.
  const analysed = meta.contentKind;
  if (typeof analysed === "string" && CONTENT_KINDS.has(analysed as ContentKind)) {
    return analysed as ContentKind;
  }

  if (item.pillar === "opensource" || meta.kind === "repo") return "repo";

  if (SECURITY_RE.test(text)) return "security";
  if (category === "pricing" || PRICING_RE.test(text)) return "pricing";
  if (category === "deprecation" || BREAKING_RE.test(text)) return "breaking";

  if (
    category === "regulation" ||
    category === "ban" ||
    category === "policy" ||
    category === "country" ||
    item.pillar === "world"
  ) {
    return "policy";
  }

  // Directory listing (FutureTools, Product Hunt): a standalone tool
  if (meta.kind === "tool") return "tool";

  // "Model" needs the text to actually name a model. The classifier's category
  // alone is too eager — it fires on any story mentioning LLMs.
  const namesAModel = MODEL_RE.test(text);
  const isSoftware = SOFTWARE_RE.test(text);
  if (namesAModel && !isSoftware) return "model";
  if ((category === "new_model" || category === "capacity") && namesAModel) {
    return "model";
  }
  if (isSoftware && item.pillar !== "models") return "tool";

  // Vendor announcement about an existing product
  if (FEATURE_RE.test(text)) return "feature";

  if (item.pillar === "tools") return "tool";
  return "news";
}

const KIND_LABELS: Record<ContentKind, { fr: string; en: string }> = {
  repo: { fr: "GitHub", en: "GitHub" },
  tool: { fr: "Outil", en: "Tool" },
  feature: { fr: "Fonctionnalité", en: "Feature" },
  model: { fr: "Modèle", en: "Model" },
  pricing: { fr: "Prix", en: "Pricing" },
  breaking: { fr: "Changement majeur", en: "Major change" },
  security: { fr: "Sécurité", en: "Security" },
  policy: { fr: "Régulation", en: "Policy" },
  news: { fr: "Actu", en: "News" },
};

export function contentKindLabel(kind: ContentKind, locale: HubLocale): string {
  return KIND_LABELS[kind][locale];
}

/** Chip tone per kind: action-required kinds pop, informative kinds stay calm. */
export function contentKindTone(
  kind: ContentKind,
): "urgent" | "ok" | "warn" | "muted" {
  if (kind === "pricing" || kind === "breaking" || kind === "security") {
    return "urgent";
  }
  if (kind === "model" || kind === "feature") return "ok";
  if (kind === "policy") return "warn";
  return "muted";
}
