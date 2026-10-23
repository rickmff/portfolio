import { googleConfigured } from "@/lib/auth";

const ERRORS: Record<string, string> = {
  account: "This Google account has no access.",
  state: "The sign-in expired. Try again.",
  google: "Google sign-in failed. Try again.",
  config: "Google sign-in is not set up on the server yet.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const href = `/admin/auth/google${next?.startsWith("/admin") ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <main className="adm-login">
      <p className="eyebrow">Backoffice</p>
      <h1>Sign in</h1>
      {googleConfigured() ? (
        <div className="adm-form">
          <a href={href} className="adm-btn primary">Continue with Google</a>
          {error ? <p className="adm-error" role="alert">{ERRORS[error] ?? ERRORS.google}</p> : null}
        </div>
      ) : (
        <p className="adm-error">
          Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and SESSION_SECRET (32+ characters) in the environment first.
        </p>
      )}
    </main>
  );
}
