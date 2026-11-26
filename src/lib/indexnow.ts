import "server-only";
import { after } from "next/server";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "./seo";

/** An 8–128 character key you choose; the same value is served at /indexnow.txt to prove the site is yours. */
export const INDEXNOW_KEY = process.env.INDEXNOW_KEY?.trim() || "";

/**
 * Tells Bing, Yandex, Seznam and Naver (IndexNow) that the site changed, so they recrawl in
 * minutes instead of days. It runs after the response is sent and never fails the save.
 * Every sitemap URL is sent: the site is small and a save can change any page's lists.
 */
export function pingIndexNow() {
  if (!INDEXNOW_KEY || !SITE_URL.startsWith("https://")) return;
  after(async () => {
    try {
      const urlList = (await sitemap()).map((e) => e.url);
      await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: new URL(SITE_URL).host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/indexnow.txt`, urlList }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {}
  });
}
