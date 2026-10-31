import { requireAuthUser, supabaseForEvent } from "~/server/utils/supabase-auth";
import { runDiagnoseBudget } from "~/server/utils/expense-diagnose";

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  const supabase = supabaseForEvent(event);
  return runDiagnoseBudget(supabase, user.id);
});
