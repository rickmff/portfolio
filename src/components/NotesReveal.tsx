"use client";

import { useState } from "react";

/**
 * Keeps spoiler-heavy notes covered, like a secret value in a hosting dashboard,
 * until the reader asks for them. The cover then slides away and the text unblurs.
 */
export function NotesReveal({ html }: { html: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className={`notes${shown ? " is-shown" : ""}`}>
      <div className="notes-body" inert={!shown} aria-hidden={!shown} dangerouslySetInnerHTML={{ __html: html }} />
      <div className="notes-cover" aria-hidden={shown}>
        <span className="mono notes-cover-label">Spoilers · hidden</span>
        <button type="button" className="notes-btn" onClick={() => setShown(true)} disabled={shown}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Reveal notes
        </button>
      </div>
      {shown ? (
        <button type="button" className="notes-hide mono" onClick={() => setShown(false)}>
          Hide again
        </button>
      ) : null}
    </div>
  );
}
