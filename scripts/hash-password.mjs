// Usage: pnpm hash-password 'your password'  → prints ADMIN_PASSWORD_HASH (base64 of a bcrypt hash,
// so it has no `$` for .env files or Docker Compose to mangle).
import bcrypt from "bcryptjs";

const pw = process.argv[2];
if (!pw) {
  console.error("Usage: pnpm hash-password '<password>'");
  process.exit(1);
}
const hash = await bcrypt.hash(pw, 12);
console.log(Buffer.from(hash).toString("base64"));
