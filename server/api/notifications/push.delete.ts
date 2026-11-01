import { requireAuthUser, supabaseForEvent } from "~/server/utils/supabase-auth";

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  const endpoint = getQuery(event).endpoint;
  if (typeof endpoint !== "string") throw createError({ statusCode: 400 });

  const supabase = supabaseForEvent(event);
  await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
  return { ok: true };
});
