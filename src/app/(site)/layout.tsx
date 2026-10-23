import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { PageTransition } from "@/components/PageTransition";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SmoothScroll } from "@/components/SmoothScroll";
import { getSettings, hasHarness } from "@/lib/data";
import { LocaleProvider } from "@/lib/i18n/client";
import { DICTS } from "@/lib/i18n/dict";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, harness, locale] = await Promise.all([getSettings(), hasHarness(), getLocale()]);
  const t = DICTS[locale];
  return (
    <LocaleProvider locale={locale}>
      <SmoothScroll />
      <ScrollReveal />
      <PageTransition />
      <SiteHeader settings={settings} harness={harness} t={t} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </LocaleProvider>
  );
}
