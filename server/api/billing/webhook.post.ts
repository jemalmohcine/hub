/** Webhook stub — wire real PSP signature verification when integrating. */
export default defineEventHandler(async (event) => {
  const payload = await readBody(event).catch(() => ({}));
  return {
    ok: true,
    provider: "stub",
    message: "Webhook received (stub). No provider synced yet.",
    received: payload,
  };
});
