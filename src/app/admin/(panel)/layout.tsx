import Link from "next/link";
import { cookies } from "next/headers";
import { SideNav, ThemeToggle } from "@/components/admin/Controls";
import { Icon } from "@/components/admin/Icon";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function Panel({ children }: { children: React.ReactNode }) {
  const chosen = (await cookies()).get("adm_theme")?.value;
  const theme = chosen === "light" || chosen === "dark" ? chosen : "system";
  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link href="/admin" className="adm-brand">
          <span className="adm-brand-mark">B</span> Backoffice
        </Link>
        <SideNav />
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noreferrer">
            <Icon name="external" /> <span>View site</span>
          </a>
          <form action={logout}>
            <button type="submit">
              <Icon name="out" /> <span>Sign out</span>
            </button>
          </form>
          <ThemeToggle initial={theme} />
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
