import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin server action; middleware only guards page loads. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && (process.env.SESSION_SECRET?.length ?? 0) >= 32,
  );
}

/**
 * The public origin for auth redirects. It comes from env, not the request host.
 * Same fallback as SITE_URL in seo.ts: on Vercel without SITE_URL, the production domain.
 */
export function publicOrigin() {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return (process.env.SITE_URL || vercel || "http://localhost:3000").replace(/\/$/, "");
}

/** Google must send the user back to exactly this URL (it has to be listed in the OAuth client). */
export function googleRedirectUri() {
  return `${publicOrigin()}/admin/auth/callback`;
}

export const OAUTH_COOKIE = "pf_oauth";
