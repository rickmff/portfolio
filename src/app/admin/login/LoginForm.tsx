"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="adm-form">
      <input type="hidden" name="next" value={next} />
      <label className="adm-field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required autoFocus />
      </label>
      <button type="submit" className="adm-btn primary" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </button>
      {state?.error ? <p className="adm-error" role="alert">{state.error}</p> : null}
    </form>
  );
}
