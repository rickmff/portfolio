import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SmoothScroll } from "@/components/SmoothScroll";
import { getSettings, hasHarness } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, harness] = await Promise.all([getSettings(), hasHarness()]);
  return (
    <>
      <SmoothScroll />
      <SiteHeader settings={settings} harness={harness} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </>
  );
}
