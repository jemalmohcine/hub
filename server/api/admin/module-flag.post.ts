import { createAdminClient } from "~/server/utils/supabase-admin";
import { requireAuthUser } from "~/server/utils/supabase-auth";

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{ moduleId?: string; enabled?: boolean }>(event);
  if (!body?.moduleId || typeof body.enabled !== "boolean") {
    throw createError({ statusCode: 400 });
  }

  const { error } = await supabase.from("module_flags").upsert({
    module_id: body.moduleId,
    enabled: body.enabled,
    updated_at: new Date().toISOString(),
  });

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return { ok: true };
});
