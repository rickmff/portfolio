"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { uploadImage } from "@/app/admin/actions";
import { renderMarkdown } from "@/lib/markdown";

type Mode = "write" | "split" | "preview";

const CHEATSHEET: [string, string][] = [
  ["# Title  ## Section  ### Sub", "Headings"],
  ["**bold**  *italic*  ~~strike~~  `code`", "Inline"],
  ["[text](https://…)", "Link"],
  ["![alt](url \"Caption\")", "Image with caption"],
  ["- item  1. item  - [ ] task", "Lists"],
  ["> quote", "Quote"],
  ["> [!NOTE]  [!TIP]  [!WARNING]", "Callout"],
  ["```ts … ```", "Code block (any language)"],
  ["| a | b |\\n|---|---|", "Table"],
  ["text[^1]  …  [^1]: note", "Footnote"],
  ["---", "Divider"],
  ["<details><summary>…</summary>…</details>", "Collapsible"],
];

export function MarkdownField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [mode, setMode] = useState<Mode>("split");
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);

  // Rendering trails typing slightly on long posts instead of blocking keystrokes.
  const deferred = useDeferredValue(value);
  const html = useMemo(() => (mode === "write" ? "" : renderMarkdown(deferred)), [deferred, mode]);

  const insert = (text: string) => {
    const el = area.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + text + value.slice(end));
  };

  const upload = async (f: File) => {
    setBusy(true);
    const fd = new FormData();
    fd.set("file", f);
    const res = await uploadImage(fd);
    setBusy(false);
    if (res.url) insert(`\n![](${res.url})\n`);
    else alert(res.error);
  };

  // Keeps the preview at the same relative position as the editor while scrolling in split view.
  const syncScroll = () => {
    const a = area.current;
    const p = preview.current;
    if (!a || !p || mode !== "split") return;
    const ratio = a.scrollTop / Math.max(1, a.scrollHeight - a.clientHeight);
    p.scrollTop = ratio * (p.scrollHeight - p.clientHeight);
  };

  return (
    <div className="adm-field">
      <div className="adm-md-bar">
        <span>{label}</span>
        <div>
          {(["write", "split", "preview"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m === "write" ? "Write" : m === "split" ? "Side by side" : "Preview"}
            </button>
          ))}
          <button type="button" onClick={() => file.current?.click()} disabled={busy}>
            {busy ? "Uploading…" : "Insert image"}
          </button>
        </div>
      </div>
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <div className={`adm-md-panes is-${mode}`}>
        <textarea
          ref={area}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onScroll={syncScroll}
          onDrop={(e) => {
            const f = e.dataTransfer.files?.[0];
            if (f?.type.startsWith("image/")) {
              e.preventDefault();
              upload(f);
            }
          }}
          onPaste={(e) => {
            const f = [...e.clipboardData.files].find((x) => x.type.startsWith("image/"));
            if (f) {
              e.preventDefault();
              upload(f);
            }
          }}
          rows={22}
          className="adm-md"
          hidden={mode === "preview"}
          aria-label={label}
          spellCheck
        />
        {mode !== "write" ? (
          <div ref={preview} className="adm-preview" aria-label={`${label} preview`}>
            {value.trim() ? (
              <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="adm-preview-empty">The rendered Markdown shows up here as you type.</p>
            )}
          </div>
        ) : null}
      </div>
      <details className="adm-md-help">
        <summary>Full Markdown is supported. Drop or paste an image to upload it. <u>Syntax</u></summary>
        <dl>
          {CHEATSHEET.map(([code, what]) => (
            <div key={what}>
              <dt>
                <code>{code}</code>
              </dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
