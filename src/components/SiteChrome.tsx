import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { Dict } from "@/lib/i18n/dict";
import type { SiteSettings } from "@/lib/settings";

export function SiteHeader({ settings, harness = false, t }: { settings: SiteSettings; harness?: boolean; t: Dict }) {
  return (
    <header className="wrap site-header">
      <Link href="/" className="site-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profile.jpg?v=5" alt="" width={36} height={36} className="site-avatar" />
        {settings.name}
      </Link>
      <nav aria-label="Main">
        <Link href="/#work" className="link-muted">{t.nav.work}</Link>
        <Link href="/books" className="link-muted">{t.nav.books}</Link>
        <Link href="/blog" className="link-muted">{t.nav.writing}</Link>
        {harness ? <Link href="/harness" className="link-muted">{t.nav.harness}</Link> : null}
        {settings.about ? <Link href="/about" className="link-muted">{t.nav.about}</Link> : null}
        {settings.email ? (
          <a href={`mailto:${settings.email}`} className="link-muted">Email</a>
        ) : null}
      </nav>
    </header>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="wrap site-footer">
      <span>© {new Date().getFullYear()} {settings.name}</span>
      <span>
        {settings.github ? <a href={settings.github} className="link-muted">GitHub</a> : null}
        {settings.linkedin ? <a href={settings.linkedin} className="link-muted">LinkedIn</a> : null}
        {settings.twitter ? <a href={settings.twitter} className="link-muted">X</a> : null}
        {settings.discord ? <a href={settings.discord} className="link-muted">Discord</a> : null}
        {settings.email ? <a href={`mailto:${settings.email}`} className="link-muted">Email</a> : null}
        <a href="/rss.xml" className="link-muted">RSS</a>
        <LanguageToggle />
      </span>
    </footer>
  );
}

/** Renders "**word**" segments of the hero sentence as <strong>. */
export function Emphasis({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p,
      )}
    </>
  );
}
