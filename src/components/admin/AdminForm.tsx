"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/admin/actions";
import { Icon } from "./Icon";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

/**
 * An editable page, laid out like a Notion page: a sticky bar with the breadcrumb, the save
 * state and the actions, then the page itself. ⌘S / Ctrl+S saves; leaving with unsaved
 * changes asks first.
 */
export function AdminForm({
  action,
  children,
  submitLabel = "Save",
  crumb,
  title,
  viewHref,
  deleteAction,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  /** The list this page belongs to, shown before the title in the bar. */
  crumb?: { href: string; label: string };
  title?: string;
  viewHref?: string;
  deleteAction?: () => Promise<void>;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const form = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const [liveTitle, setLiveTitle] = useState(title);

  useEffect(() => {
    if (state?.ok) setDirty(false);
  }, [state]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        form.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form
      ref={form}
      action={formAction}
      className="adm-form"
      onInput={(e) => {
        setDirty(true);
        const t = e.target as HTMLInputElement;
        if (t.classList.contains("adm-title")) setLiveTitle(t.value);
      }}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
    >
      <div className="adm-bar">
        <nav className="adm-crumbs" aria-label="Breadcrumb">
          {crumb ? (
            <>
              <Link href={crumb.href}>{crumb.label}</Link>
              <span aria-hidden="true">/</span>
            </>
          ) : null}
          <span className="adm-crumb-here">{liveTitle?.trim() || title || "Untitled"}</span>
        </nav>
        <div className="adm-bar-actions">
          <SaveState dirty={dirty} state={state} />
          {viewHref ? (
            <Link href={viewHref} target="_blank" className="adm-ghost" title="View on the site">
              <Icon name="external" size={14} />
              <span>View</span>
            </Link>
          ) : null}
          {deleteAction ? (
            <button
              type="submit"
              formAction={deleteAction}
              formNoValidate
              className="adm-ghost adm-ghost-danger"
              title="Delete"
              aria-label="Delete"
              onClick={(e) => {
                if (!confirm("Delete this for good?")) e.preventDefault();
                else setDirty(false);
              }}
            >
              <Icon name="trash" size={14} />
            </button>
          ) : null}
          <Submit label={submitLabel} />
        </div>
      </div>
      <div className="adm-page">{children}</div>
    </form>
  );
}

function SaveState({ dirty, state }: { dirty: boolean; state: FormState }) {
  const { pending } = useFormStatus();
  if (pending) return <span className="adm-status">Saving…</span>;
  if (state?.error)
    return (
      <span className="adm-status is-error" role="alert" title={state.error}>
        {state.error}
      </span>
    );
  if (dirty)
    return (
      <span className="adm-status is-dirty">
        <span className="adm-dot" aria-hidden="true" /> Unsaved
      </span>
    );
  if (state?.ok) return <span className="adm-status is-ok" role="status">Saved</span>;
  return null;
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="adm-btn primary sm" disabled={pending} title="Save (⌘S)">
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
