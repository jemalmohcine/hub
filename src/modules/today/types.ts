import type { ModuleId } from "@/core/module-registry";

export type TodayTone = "urgent" | "attention" | "neutral";

/** One actionable line on the daily board. */
export type TodaySignal = {
  id: string;
  module: ModuleId;
  tone: TodayTone;
  /** Short label, e.g. "3 alertes urgentes". */
  label: string;
  /** Why it matters, one sentence. */
  detail: string;
  href: string;
};

export type TodayHighlight = {
  id: string;
  title: string;
  source: string;
  href: string;
  treated?: boolean;
};

export type TodayDigest = {
  /** Actionable lines, already sorted by urgency. */
  signals: TodaySignal[];
  /** Top urgent AI items, ready to open. */
  highlights: TodayHighlight[];
  /** When the nightly analysis last completed. */
  lastRunAt: string | null;
  /** True when nothing needs attention — we celebrate instead of showing zeros. */
  allClear: boolean;
};
