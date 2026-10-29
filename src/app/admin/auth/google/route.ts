import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_COOKIE, googleConfigured, googleRedirectUri } from "@/lib/auth";
import { adminEmail, createOAuthState } from "@/lib/session";

const b64url = (b: Buffer) => b.toString("base64url");

/** Starts Google sign-in. Only the admin account can finish it (checked in the callback). */
export async function GET(req: NextRequest) {
  if (!googleConfigured()) return NextResponse.redirect(new URL("/admin/login?error=config", process.env.SITE_URL ?? req.url));
  const next = req.nextUrl.searchParams.get("next") ?? "";
  const state = b64url(randomBytes(24));
  const nonce = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    login_hint: adminEmail(),
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_COOKIE, await createOAuthState({ state, nonce, verifier, next: next.startsWith("/admin") ? next : "/admin" }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin/auth",
    maxAge: 600,
  });
  return res;
}
