import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = { title: "Backoffice", robots: { index: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="adm">{children}</div>;
}
