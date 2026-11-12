import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./admin.css";

export const metadata: Metadata = { title: "Backoffice", robots: { index: false } };

/** Picks the system theme before the first paint when no theme was chosen. */
const SYSTEM_THEME = `(function(){var d=matchMedia("(prefers-color-scheme: dark)").matches,r=document.currentScript.parentElement;r.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light";if(d)document.documentElement.style.background="#191919"})()`;

export default async function AdminRoot({ children }: { children: React.ReactNode }) {
  const chosen = (await cookies()).get("adm_theme")?.value;
  const theme = chosen === "light" || chosen === "dark" ? chosen : undefined;
  return (
    <div className="adm" data-theme={theme} suppressHydrationWarning>
      {theme ? null : <script dangerouslySetInnerHTML={{ __html: SYSTEM_THEME }} />}
      {children}
    </div>
  );
}
