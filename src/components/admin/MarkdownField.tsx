"use client";

import dynamic from "next/dynamic";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { uploadImage } from "@/app/admin/actions";
import { renderMarkdown } from "@/lib/markdown";

type Mode = "blocks" | "write" | "split" | "preview";

// The block editor is heavy, so it loads only on pages that use it.
const BlockEditor = dynamic(() => import("./editor/BlockEditor"), {
  ssr: false,
  loading: () => <div className="nb-shell nb-loading-shell">Loading editor…</div>,
});

const MODES: { id: Mode; label: string; blocks?: boolean }[] = [
  { id: "blocks", label: "Editor", blocks: true },
  { id: "write", label: "Markdown" },
  { id: "split", label: "Side by side" },
  { id: "preview", label: "Preview" },
];

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

/**
 * A Markdown body field. With `blocks`, it opens in the Notion-style block editor and the Markdown
 * modes stay one click away; the saved value is Markdown either way.
 */
export function MarkdownField({
  name,
  label,
  defaultValue,
  blocks = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  blocks?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [mode, setMode] = useState<Mode>(blocks ? "blocks" : "split");
  // The block editor reports every change here without re-rendering this field on each keystroke.
  const latest = useRef(value);
  const switchMode = (m: Mode) => {
    if (mode === "blocks") setValue(latest.current);
    else latest.current = value;
    setMode(m);
  };
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);

  // Rendering trails typing slightly on long posts instead of blocking keystrokes.
  const deferred = useDeferredValue(value);
  const html = useMemo(() => (mode === "write" || mode === "blocks" ? "" : renderMarkdown(deferred)), [deferred, mode]);

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
          {MODES.filter((m) => blocks || !m.blocks).map((m) => (
            <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => switchMode(m.id)}>
              {!blocks && m.id === "write" ? "Write" : m.label}
            </button>
          ))}
          {mode !== "blocks" ? (
            <button type="button" onClick={() => file.current?.click()} disabled={busy}>
              {busy ? "Uploading…" : "Insert image"}
            </button>
          ) : null}
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
      {mode === "blocks" ? (
        <BlockEditor
          name={name}
          label={label}
          initial={latest.current}
          onChange={(md) => {
            latest.current = md;
          }}
        />
      ) : null}
      <div className={`adm-md-panes is-${mode}`} hidden={mode === "blocks"}>
        <textarea
          ref={area}
          name={mode === "blocks" ? undefined : name}
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
          hidden={mode === "preview" || mode === "blocks"}
          aria-label={label}
          spellCheck
        />
        {mode !== "write" && mode !== "blocks" ? (
          <div ref={preview} className="adm-preview" aria-label={`${label} preview`}>
            {value.trim() ? (
              <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="adm-preview-empty">The rendered Markdown shows up here as you type.</p>
            )}
          </div>
        ) : null}
      </div>
      {mode === "blocks" ? (
        <p className="adm-md-hint">
          Type <kbd>/</kbd> for blocks, select text to format it, drag <kbd>⋮⋮</kbd> to move a block. Markdown shortcuts work too:{" "}
          <code>#</code> <code>-</code> <code>1.</code> <code>[]</code> <code>&gt;</code> toggle, <code>&quot;</code> quote, <code>```</code> <code>---</code>.
        </p>
      ) : (
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
      )}
    </div>
  );
}
