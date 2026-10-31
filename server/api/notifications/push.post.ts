import { requireAuthUser, supabaseForEvent } from "~/server/utils/supabase-auth";

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  const body = await readBody<{
    endpoint?: string;
    keys?: { p256dh: string; auth: string };
    userAgent?: string;
  }>(event);

  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    throw createError({ statusCode: 400 });
  }

  const supabase = supabaseForEvent(event);
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      user_agent: body.userAgent ?? null,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return { ok: true };
});
