"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fileSizeError, formatMb } from "@/lib/upload-limits";
import { Icon, type IconName } from "./Icon";

/* Textareas that grow with their text, so nothing scrolls inside a field. */

function fit(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => fit(ref.current), []);
  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      onInput={(e) => {
        fit(e.currentTarget);
        props.onInput?.(e);
      }}
    />
  );
}

/** The page title: one line that wraps like a heading. Enter jumps to the first property. */
export function TitleInput({
  name,
  defaultValue,
  placeholder = "Untitled",
  required,
  autoFocus,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <AutoTextarea
      name={name}
      className="adm-title"
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      required={required}
      aria-label="Title"
      autoFocus={autoFocus ?? !defaultValue}
      spellCheck
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const scope = e.currentTarget.closest(".adm-tab-panel") ?? e.currentTarget.closest("form");
        const next = scope?.querySelector<HTMLElement>(".adm-prop-v :is(input, textarea, select)");
        next?.focus();
      }}
    />
  );
}

/**
 * A file property: the current file (thumbnail for images), an Upload chip that shows the picked
 * file's name, and a Remove switch when there is something to remove.
 */
export function FilePick({
  id,
  name,
  accept,
  current,
  kind = "file",
  removeName,
  removeLabel = "Remove",
}: {
  id?: string;
  name: string;
  accept?: string;
  current?: string | null;
  kind?: "image" | "file";
  removeName?: string;
  removeLabel?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{ name: string; size: number; url: string | null } | null>(null);
  const [tooBig, setTooBig] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  useEffect(() => () => {
    if (picked?.url) URL.revokeObjectURL(picked.url);
  }, [picked]);

  const preview = picked?.url ?? (removing ? null : current);
  const short = (u: string) => decodeURIComponent(u.split("/").pop()?.split("?")[0] ?? u);

  return (
    <div className={`adm-file${removing ? " is-removing" : ""}`}>
      {kind === "image" && preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="adm-file-thumb" src={preview} alt="" />
      ) : null}
      {kind === "file" && current && !picked ? (
        <a className="adm-chip" href={current} target="_blank" rel="noreferrer" title={current}>
          <Icon name="file" size={14} />
          <span>{short(current)}</span>
        </a>
      ) : null}
      <label className="adm-chip adm-chip-btn">
        <input
          ref={input}
          id={id}
          type="file"
          name={name}
          accept={accept}
          className="adm-sr"
          onChange={(e) => {
            const f = e.target.files?.[0];
            // Too big to save: drop it here, before it reaches the server and fails the save.
            const err = f ? fileSizeError(f) : null;
            setTooBig(err);
            if (err) {
              e.target.value = "";
              setPicked(null);
              return;
            }
            setPicked(f ? { name: f.name, size: f.size, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null } : null);
          }}
        />
        <Icon name="upload" size={14} />
        <span>{picked ? `${picked.name} · ${formatMb(picked.size)}` : current ? "Replace" : "Upload"}</span>
      </label>
      {picked ? (
        <button
          type="button"
          className="adm-chip adm-chip-btn"
          aria-label="Clear the picked file"
          onClick={() => {
            if (input.current) input.current.value = "";
            setPicked(null);
            setTooBig(null);
          }}
        >
          <Icon name="x" size={14} />
        </button>
      ) : null}
      {removeName && current ? (
        <label className="adm-chip adm-chip-btn adm-chip-danger" data-on={removing || undefined}>
          <input type="checkbox" name={removeName} className="adm-sr" onChange={(e) => setRemoving(e.target.checked)} />
          <Icon name="trash" size={14} />
          <span>{removing ? "Will be removed" : removeLabel}</span>
        </label>
      ) : null}
      {tooBig ? (
        <span className="adm-file-error" role="alert">
          {tooBig}
        </span>
      ) : null}
    </div>
  );
}

/** A colour property: a round swatch that opens the native picker, next to its hex value. */
export function ColorPick({ id, name, defaultValue }: { id?: string; name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<HTMLInputElement>(null);
  // The book lookup sets the value from outside; keep the hex label in step.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setValue(el.value);
    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, []);
  return (
    <label className="adm-color">
      <input ref={ref} id={id} type="color" name={name} defaultValue={defaultValue} onChange={(e) => setValue(e.target.value)} />
      <span className="mono">{value.toUpperCase()}</span>
    </label>
  );
}

/* Sidebar */

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/projects", label: "Projects", icon: "grid" },
  { href: "/admin/books", label: "Books", icon: "book" },
  { href: "/admin/posts", label: "Posts", icon: "pen" },
  { href: "/admin/harness", label: "Harness", icon: "wrench" },
  { href: "/admin/settings", label: "Settings", icon: "gear" },
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Backoffice" className="adm-nav">
      {NAV.map((n) => {
        const on = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined}>
            <Icon name={n.icon} />
            <span>{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* Theme: light, dark or follow the system. Saved in a cookie so the server renders it first. */

type Theme = "light" | "dark" | "system";
const THEME_COOKIE = "adm_theme"; // also read in src/app/admin/layout.tsx
const THEMES: { id: Theme; label: string; icon: IconName }[] = [
  { id: "light", label: "Light", icon: "sun" },
  { id: "dark", label: "Dark", icon: "moon" },
  { id: "system", label: "System", icon: "monitor" },
];

function apply(theme: Theme) {
  const root = document.querySelector<HTMLElement>(".adm");
  if (!root) return;
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document.documentElement.style.background = dark ? "#191919" : "";
}

export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => apply("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [theme]);
  // Leaving the backoffice hands the page back to the site's own colours.
  useEffect(
    () => () => {
      document.documentElement.style.colorScheme = "";
      document.documentElement.style.background = "";
    },
    [],
  );
  return (
    <div className="adm-theme" role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={theme === t.id}
          title={t.label}
          onClick={() => {
            setTheme(t.id);
            document.cookie = `${THEME_COOKIE}=${t.id}; path=/admin; max-age=31536000; samesite=lax`;
          }}
        >
          <Icon name={t.icon} size={14} />
          <span className="adm-sr">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/* Language tabs: the original text and its English and Portuguese versions, one page each. */

export function LangTabs({
  tabs,
  panels,
}: {
  tabs: { id: string; label: string; note?: string; filled?: boolean }[];
  panels: React.ReactNode[];
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  // Textareas measured while their tab was hidden have no height yet: size them on show.
  useEffect(() => {
    document.querySelectorAll<HTMLTextAreaElement>(`#panel-${active} textarea`).forEach((el) => {
      if (!el.classList.contains("adm-md")) fit(el);
    });
  }, [active]);
  return (
    // A required field in a hidden tab would block saving silently: show its tab instead.
    <div
      className="adm-tabs-wrap"
      onInvalidCapture={(e) => {
        const panel = (e.target as HTMLElement).closest<HTMLElement>(".adm-tab-panel");
        if (panel?.hidden) setActive(panel.id.replace(/^panel-/, ""));
      }}
    >
      <div className="adm-tabbar" role="tablist" aria-label="Language">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
            {t.note ? <small data-filled={t.filled || undefined}>{t.note}</small> : null}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        // Hidden panels stay in the form, so every language saves together.
        <div
          key={t.id}
          id={`panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${t.id}`}
          className="adm-tab-panel"
          hidden={active !== t.id}
        >
          {panels[i]}
        </div>
      ))}
    </div>
  );
}
