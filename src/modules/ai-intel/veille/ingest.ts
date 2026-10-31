import { createAdminClient } from "@/core/auth/supabase/admin";
import {
  parseVeilleIngestBody,
  veilleIngestRow,
} from "@/modules/ai-intel/veille/ingest-schema";

export type VeilleIngestResult = {
  upserted: number;
  ids: string[];
};

export async function upsertVeilleItems(body: unknown): Promise<VeilleIngestResult> {
  const parsed = parseVeilleIngestBody(body);
  if (parsed.length === 0) {
    return { upserted: 0, ids: [] };
  }

  const rows = parsed.map(veilleIngestRow);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("veille_ia_items")
    .upsert(rows, { onConflict: "link,title" })
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  const ids = (data ?? []).map((row) => row.id as string);
  return { upserted: ids.length, ids };
}
