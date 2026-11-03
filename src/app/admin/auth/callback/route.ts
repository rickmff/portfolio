import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_COOKIE, googleConfigured, googleRedirectUri, publicOrigin } from "@/lib/auth";
import { SESSION_COOKIE, adminEmail, createSessionToken, readOAuthState, sessionCookieOptions } from "@/lib/session";

const GOOGLE_KEYS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function fail(req: NextRequest, error: string) {
  const res = NextResponse.redirect(new URL(`/admin/login?error=${error}`, publicOrigin()));
  res.cookies.delete({ name: OAUTH_COOKIE, path: "/admin/auth" });
  return res;
}

/** Google sends the user back here. Signs in only a verified rickmff@gmail.com (ADMIN_EMAIL). */
export async function GET(req: NextRequest) {
  if (!googleConfigured()) return fail(req, "config");
  const params = req.nextUrl.searchParams;
  const saved = await readOAuthState(req.cookies.get(OAUTH_COOKIE)?.value);
  const code = params.get("code");
  if (!saved || !code || params.get("state") !== saved.state) return fail(req, "state");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: saved.verifier,
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) return fail(req, "google");
  const { id_token } = (await tokenRes.json()) as { id_token?: string };
  if (!id_token) return fail(req, "google");

  let email = "";
  try {
    const { payload } = await jwtVerify(id_token, GOOGLE_KEYS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    if (payload.nonce !== saved.nonce || payload.email_verified !== true) return fail(req, "google");
    email = String(payload.email ?? "").toLowerCase();
  } catch {
    return fail(req, "google");
  }
  if (email !== adminEmail()) return fail(req, "account");

  const res = NextResponse.redirect(new URL(saved.next, publicOrigin()));
  res.cookies.delete({ name: OAUTH_COOKIE, path: "/admin/auth" });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(email), sessionCookieOptions);
  return res;
}
