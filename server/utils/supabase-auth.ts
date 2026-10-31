import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { H3Event } from "h3";

export async function requireAuthUser(event: H3Event) {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Non authentifié" });
  }
  return user;
}

export function supabaseForEvent(event: H3Event) {
  return serverSupabaseClient(event);
}
