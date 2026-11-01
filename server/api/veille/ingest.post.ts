import { upsertVeilleItems } from "../../utils/veille/ingest-service";
import { ZodError } from "zod";

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
  }

  const config = useRuntimeConfig();
  const secret = config.veilleIngestSecret;
  if (!secret || getHeader(event, "x-ingest-secret") !== secret) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  let body: unknown;
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Invalid JSON body" });
  }

  try {
    const result = await upsertVeilleItems(body);
    return { ok: true, ...result };
  } catch (err) {
    if (err instanceof ZodError) {
      setResponseStatus(event, 400);
      return { ok: false, error: "Validation failed", details: err.flatten() };
    }
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});
