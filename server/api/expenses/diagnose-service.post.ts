import { requireAuthUser, supabaseForEvent } from "~/server/utils/supabase-auth";
import { runDiagnoseBudget, runDiagnoseService } from "~/server/utils/expense-diagnose";

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  const body = await readBody<{ serviceId?: string }>(event);
  if (!body?.serviceId) {
    throw createError({ statusCode: 400, statusMessage: "serviceId requis" });
  }
  const supabase = supabaseForEvent(event);
  const diagnostic = await runDiagnoseService(supabase, user.id, body.serviceId);
  return diagnostic;
});
