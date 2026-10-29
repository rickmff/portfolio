import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";
import { holidayAttr } from "@/seasonal/halloween-2026"; // seasonal:halloween

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], weight: ["300", "400", "500"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Henrique Matos", template: "%s — Henrique Matos" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale === "pt" ? "pt-BR" : "en"} data-holiday={holidayAttr()} /* seasonal:halloween */>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
