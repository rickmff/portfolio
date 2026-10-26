import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getSettings, hasHarness } from "@/lib/data";
import { LocaleProvider } from "@/lib/i18n/client";
import { DICTS } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/server";
import { pageMeta, personSchema, websiteSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Site-wide defaults; each page replaces them with its own canonical and card via `pageMeta`. */
export async function generateMetadata(): Promise<Metadata> {
  const [settings, locale] = await Promise.all([getSettings(), getLocale()]);
  return {
    ...pageMeta(settings, locale, {}),
    title: { default: settings.name, template: `%s — ${settings.name}` },
    authors: [{ name: settings.name, url: "/about" }],
    creator: settings.name,
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, harness, locale] = await Promise.all([getSettings(), hasHarness(), getLocale()]);
  const t = DICTS[locale];
  return (
    <LocaleProvider locale={locale}>
      <JsonLd graph={[personSchema(settings), websiteSchema(settings, locale)]} />
      <ScrollReveal />
      <PageTransition />
      <SiteHeader settings={settings} harness={harness} t={t} />
      <main>{children}</main>
      <SiteFooter settings={settings} harness={harness} t={t} />
    </LocaleProvider>
  );
}
