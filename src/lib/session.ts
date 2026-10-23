import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pf_session";
const MAX_AGE = 60 * 60 * 24 * 14;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
}

/** The one Google account allowed into /admin. */
export function adminEmail() {
  return (process.env.ADMIN_EMAIL || "rickmff@gmail.com").trim().toLowerCase();
}

export async function createSessionToken(email: string) {
  return new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    // Changing ADMIN_EMAIL signs out sessions of the previous account.
    return payload.role === "admin" && payload.email === adminEmail();
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

/** Short-lived state for the Google round trip: CSRF state, nonce, PKCE verifier and where to land. */
export async function createOAuthState(data: { state: string; nonce: string; verifier: string; next: string }) {
  return new SignJWT(data).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("10m").sign(secret());
}

export async function readOAuthState(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload as unknown as { state: string; nonce: string; verifier: string; next: string };
  } catch {
    return null;
  }
}
