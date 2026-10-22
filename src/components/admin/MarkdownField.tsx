"use client";

import { marked } from "marked";
import { useRef, useState } from "react";
import { uploadImage } from "@/app/admin/actions";

export function MarkdownField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);

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

  return (
    <div className="adm-field">
      <div className="adm-md-bar">
        <span>{label}</span>
        <div>
          <button type="button" aria-pressed={tab === "write"} onClick={() => setTab("write")}>Write</button>
          <button type="button" aria-pressed={tab === "preview"} onClick={() => setTab("preview")}>Preview</button>
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
      <textarea
        ref={area}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onDrop={(e) => {
          const f = e.dataTransfer.files?.[0];
          if (f?.type.startsWith("image/")) {
            e.preventDefault();
            upload(f);
          }
        }}
        rows={22}
        className="adm-md"
        hidden={tab !== "write"}
        aria-label={label}
      />
      {tab === "preview" ? (
        <div className="prose adm-preview" dangerouslySetInnerHTML={{ __html: marked.parse(value, { async: false }) }} />
      ) : null}
      <small>Markdown. Drop an image into the editor to upload it.</small>
    </div>
  );
}
