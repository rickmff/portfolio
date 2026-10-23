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

/** Google must send the user back to exactly this URL, so it comes from SITE_URL, not the request (Caddy proxies). */
export function googleRedirectUri() {
  return `${(process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/admin/auth/callback`;
}

export const OAUTH_COOKIE = "pf_oauth";
