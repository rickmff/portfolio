import "server-only";
import bcrypt from "bcryptjs";
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

/**
 * ADMIN_PASSWORD_HASH is a base64-encoded bcrypt hash (see `pnpm hash-password`), because raw
 * bcrypt hashes contain `$`, which .env loaders and Docker Compose try to expand. A raw hash still works.
 */
export async function checkPassword(password: string) {
  const value = process.env.ADMIN_PASSWORD_HASH;
  if (!value) return false;
  const hash = value.startsWith("$2") ? value : Buffer.from(value, "base64").toString("utf8");
  return bcrypt.compare(password, hash);
}
