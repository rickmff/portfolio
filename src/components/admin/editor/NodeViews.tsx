"use client";

import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { CALLOUTS, type CalloutType } from "./markdown";

const CALLOUT_LOOK: Record<CalloutType, { icon: string; label: string }> = {
  note: { icon: "💡", label: "Note" },
  tip: { icon: "✅", label: "Tip" },
  important: { icon: "📌", label: "Important" },
  warning: { icon: "⚠️", label: "Warning" },
  caution: { icon: "🛑", label: "Caution" },
};

export function CalloutView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const type = (CALLOUTS.includes(node.attrs.type) ? node.attrs.type : "note") as CalloutType;
  const [open, setOpen] = useState(false);
  return (
    <NodeViewWrapper className="nb-callout" data-callout={type}>
      <div className="nb-callout-icon" contentEditable={false}>
        <button
          type="button"
          title={`${CALLOUT_LOOK[type].label}: click to change`}
          onClick={() => editor.isEditable && setOpen((o) => !o)}
        >
          {CALLOUT_LOOK[type].icon}
        </button>
        {open ? (
          <div className="nb-pop nb-callout-menu" onMouseLeave={() => setOpen(false)}>
            {CALLOUTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={c === type}
                onClick={() => {
                  updateAttributes({ type: c });
                  setOpen(false);
                }}
              >
                <span>{CALLOUT_LOOK[c].icon}</span> {CALLOUT_LOOK[c].label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <NodeViewContent className="nb-callout-body" />
    </NodeViewWrapper>
  );
}

const LANGS = ["", "bash", "css", "diff", "go", "html", "java", "js", "json", "jsx", "md", "python", "rust", "sql", "ts", "tsx", "yaml"];

export function CodeBlockView({ node, updateAttributes }: ReactNodeViewProps) {
  const lang = node.attrs.language ?? "";
  return (
    <NodeViewWrapper className="nb-code">
      <div className="nb-code-bar" contentEditable={false}>
        <input
          list="nb-code-langs"
          value={lang}
          placeholder="Plain text"
          aria-label="Code language"
          onChange={(e) => updateAttributes({ language: e.target.value.trim() || null })}
          size={Math.max(8, lang.length + 1)}
        />
        <datalist id="nb-code-langs">
          {LANGS.filter(Boolean).map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </div>
      <pre>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

export function ImageView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const { src, alt, title, uploading } = node.attrs as { src: string; alt?: string; title?: string; uploading?: boolean };
  return (
    <NodeViewWrapper className={`nb-image${selected ? " is-selected" : ""}`} data-drag-handle>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} className={uploading ? "is-uploading" : undefined} draggable={false} />
        {uploading ? <span className="nb-image-status">Uploading…</span> : null}
        <figcaption contentEditable={false}>
          <input
            value={title ?? ""}
            placeholder="Write a caption…"
            aria-label="Caption"
            onChange={(e) => updateAttributes({ title: e.target.value || null })}
          />
          <input
            className="nb-image-alt"
            value={alt ?? ""}
            placeholder="Alt text (describe the image)"
            aria-label="Alt text"
            onChange={(e) => updateAttributes({ alt: e.target.value || null })}
          />
        </figcaption>
      </figure>
    </NodeViewWrapper>
  );
}

export function RawMarkdownView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const text = String(node.attrs.text ?? "");
  // Grows with its content, like a block.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);
  useEffect(() => {
    if (!text) ref.current?.focus();
    // Focus only when the block is first inserted empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <NodeViewWrapper className={`nb-raw${selected ? " is-selected" : ""}`}>
      <span className="nb-raw-label" contentEditable={false}>
        Markdown
      </span>
      <textarea
        ref={ref}
        value={text}
        rows={1}
        spellCheck={false}
        placeholder="Raw Markdown or HTML, published as written"
        onChange={(e) => updateAttributes({ text: e.target.value })}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </NodeViewWrapper>
  );
}
