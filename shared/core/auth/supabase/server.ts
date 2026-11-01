import { serverSupabaseClient } from "#supabase/server";
import { getRequestEvent } from "h3";

/** Supabase client bound to the current Nitro request (cookies / RLS). */
export async function createClient() {
  const event = getRequestEvent();
  if (!event) {
    throw new Error("createClient() requires an active request event");
  }
  return serverSupabaseClient(event);
}
