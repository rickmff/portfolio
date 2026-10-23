import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SmoothScroll } from "@/components/SmoothScroll";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <SmoothScroll />
      <SiteHeader settings={settings} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </>
  );
}
