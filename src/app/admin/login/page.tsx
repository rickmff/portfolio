import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const configured = Boolean(process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET);
  return (
    <main className="adm-login">
      <p className="eyebrow">Backoffice</p>
      <h1>Sign in</h1>
      {configured ? (
        <LoginForm next={next ?? "/admin"} />
      ) : (
        <p className="adm-error">
          Set ADMIN_PASSWORD_HASH and SESSION_SECRET in the environment first. Run <code>pnpm hash-password</code> to
          make a hash.
        </p>
      )}
    </main>
  );
}
