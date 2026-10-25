import "server-only";
import type { Metadata } from "next";
import { getSettings } from "./data";
import { type Locale, localePath } from "./i18n/dict";
import { getLocale } from "./i18n/server";
import type { SiteSettings } from "./settings";

/** The public origin, without a trailing slash. Everything canonical is built on it. */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PROFILE_IMAGE = "/profile.jpg";

/** Uploads and covers are stored as site-relative paths; structured data wants full URLs. */
export const absoluteUrl = (url: string) =>
  /^https?:\/\//.test(url) ? url : url === "/" ? SITE_URL : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

/** The full URL of `path` in `locale` (Portuguese pages live under /pt). */
export const localeUrl = (locale: Locale, path: string) => absoluteUrl(localePath(locale, path));

/** hreflang links for a page that exists in both languages. */
export const languageAlternates = (path: string) => ({
  en: path,
  "pt-BR": localePath("pt", path),
  "x-default": path,
});

export const profiles = (s: SiteSettings) => [s.github, s.linkedin, s.twitter].filter(Boolean);

export const expertise = (s: SiteSettings) =>
  s.knowsAbout
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const handle = (url: string) => url.match(/(?:twitter|x)\.com\/([^/?#]+)/)?.[1];

type PageMeta = {
  title?: string;
  description?: string;
  /** Omitted only by the layout's defaults, so pages that don't set one inherit no wrong canonical. */
  path?: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  tags?: string[];
};

/**
 * One place for canonical, Open Graph and Twitter tags. Next replaces `alternates` and
 * `openGraph` wholesale when a page sets them, so every page builds the full set here
 * (the RSS link included) instead of relying on the layout's.
 */
export function pageMeta(settings: SiteSettings, locale: Locale, p: PageMeta): Metadata {
  const description = p.description || settings.bio;
  const images = [{ url: p.image ? absoluteUrl(p.image) : `${SITE_URL}/og` }];
  const site = handle(settings.twitter);
  const title = p.title ?? `${settings.name} — ${settings.role}`;
  const canonical = p.path && localePath(locale, p.path);
  return {
    ...(p.title && { title: p.title }),
    description,
    alternates: {
      ...(p.path && { canonical, languages: languageAlternates(p.path) }),
      types: { "application/rss+xml": "/rss.xml" },
    },
    openGraph: {
      type: p.type ?? "website",
      ...(canonical && { url: canonical }),
      siteName: settings.name,
      locale: locale === "pt" ? "pt_BR" : "en_US",
      alternateLocale: locale === "pt" ? "en_US" : "pt_BR",
      title,
      description,
      images,
      ...(p.type === "article" && {
        authors: [localeUrl(locale, "/about")],
        publishedTime: p.publishedTime?.toISOString(),
        modifiedTime: p.modifiedTime?.toISOString(),
        tags: p.tags,
      }),
      ...(p.type === "profile" && { username: settings.name }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
      ...(site && { site: `@${site}`, creator: `@${site}` }),
    },
  };
}

/** `pageMeta` for a page's `generateMetadata`, reading the settings and language itself. */
export async function metaFor(p: PageMeta): Promise<Metadata> {
  const [settings, locale] = await Promise.all([getSettings(), getLocale()]);
  return pageMeta(settings, locale, p);
}

/** The person every page, post and project points back to — the entity AI assistants resolve. */
export function personSchema(s: SiteSettings) {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: s.name,
    url: SITE_URL,
    image: absoluteUrl(PROFILE_IMAGE),
    jobTitle: s.role,
    description: s.bio,
    sameAs: profiles(s),
    knowsAbout: expertise(s),
    ...(s.email && { email: `mailto:${s.email}` }),
    ...(s.worksFor && { worksFor: { "@type": "Organization", name: s.worksFor } }),
    ...(s.location && { homeLocation: { "@type": "Place", name: s.location } }),
    mainEntityOfPage: `${SITE_URL}/about`,
  };
}

export function websiteSchema(s: SiteSettings, locale: Locale) {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: s.name,
    description: s.bio,
    inLanguage: locale === "pt" ? "pt-BR" : "en",
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
}

export const breadcrumbs = (locale: Locale, items: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: localeUrl(locale, it.path) })),
});
