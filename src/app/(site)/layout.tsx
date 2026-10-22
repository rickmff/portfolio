import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <SiteHeader settings={settings} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </>
  );
}
