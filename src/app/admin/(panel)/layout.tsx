import Link from "next/link";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/settings", label: "Settings" },
];

export default function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link href="/admin" className="adm-brand">
          <span className="dot" /> Backoffice
        </Link>
        <nav aria-label="Backoffice">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </nav>
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <form action={logout}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
