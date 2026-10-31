/**
 * Logged-in mobile screenshots (390px) on preview.
 * Requires env:
 *   E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY, E2E_SUPABASE_SERVICE_ROLE_KEY
 *   E2E_PREVIEW_URL (with Vercel share param if needed)
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const url = process.env.E2E_SUPABASE_URL;
const anon = process.env.E2E_SUPABASE_ANON_KEY;
const service = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const preview = process.env.E2E_PREVIEW_URL;

if (!url || !anon || !service || !preview) {
  console.error("Missing E2E_* env vars; skipping logged-in screenshots.");
  process.exit(0);
}

const admin = createClient(url, service, { auth: { persistSession: false } });
const email = `e2e-${Date.now()}@devhub-e2e.local`;
const password = `E2e-${Date.now()}!Aa1`;

const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createErr || !created.user) {
  console.error("createUser failed", createErr?.message);
  process.exit(1);
}
const userId = created.user.id;

await admin.from("dev_snippets").insert([
  {
    user_id: userId,
    title: "Test E2E snippet",
    kind: "snippet",
    language: "typescript",
    content: "console.log('e2e');",
    tags: ["e2e"],
  },
]);

const anonClient = createClient(url, anon);
const { data: signIn, error: signErr } = await anonClient.auth.signInWithPassword({ email, password });
if (signErr || !signIn.session) {
  console.error("signIn failed", signErr?.message);
  process.exit(1);
}

const outDir = "/opt/cursor/artifacts/screenshots";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});

const projectRef = new URL(url).hostname.split(".")[0];
const cookieName = `sb-${projectRef}-auth-token`;
const sessionPayload = JSON.stringify({
  access_token: signIn.session.access_token,
  refresh_token: signIn.session.refresh_token,
  expires_at: signIn.session.expires_at,
  expires_in: signIn.session.expires_in,
  token_type: "bearer",
  user: signIn.session.user,
});

await context.addCookies([
  {
    name: cookieName,
    value: encodeURIComponent(sessionPayload),
    domain: new URL(preview).hostname,
    path: "/",
    secure: true,
    sameSite: "Lax",
  },
]);

const page = await context.newPage();
for (const route of ["/app/overview", "/app/ai", "/app/snippets"]) {
  await page.goto(new URL(route, preview).href, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const slug = route.split("/").pop();
  await page.screenshot({ path: `${outDir}/mobile-logged-${slug}.png`, fullPage: true });
}

await browser.close();

await admin.from("dev_snippets").delete().eq("user_id", userId);
await admin.auth.admin.deleteUser(userId);
console.log("Logged-in screenshots saved to", outDir);
