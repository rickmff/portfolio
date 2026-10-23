"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/admin/actions";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

export function AdminForm({
  action,
  children,
  submitLabel = "Save",
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className="adm-form">
      {children}
      <div className="adm-actions">
        <Submit label={submitLabel} />
        {state?.error ? <p className="adm-error" role="alert">{state.error}</p> : null}
        {state?.ok ? <p className="adm-ok" role="status">Saved.</p> : null}
      </div>
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="adm-btn primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function DeleteButton({ action, label = "Delete" }: { action: () => Promise<void>; label?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this for good?")) e.preventDefault();
      }}
    >
      <button type="submit" className="adm-btn danger">{label}</button>
    </form>
  );
}
