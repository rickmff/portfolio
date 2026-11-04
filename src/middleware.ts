import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALE_HEADER, localeFromAcceptLanguage, localePath, splitLocale } from "@/lib/i18n/dict";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Crawlers always get the page the URL names, never a language redirect.
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|google-extended|anthropic|perplexity|chatgpt/i;

async function admin(req: NextRequest) {
  if (/^\/admin\/(login|auth)(\/|$)/.test(req.nextUrl.pathname)) return NextResponse.next();
  const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * Each language has its own URL: `/pt/...` is rewritten to the same route with the language in
 * a header, unprefixed paths are English. A visitor who chose Portuguese (or whose browser asks
 * for it, before any choice) is sent from an unprefixed page to its `/pt` twin.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return admin(req);

  const { locale, path } = splitLocale(pathname);
  // Only pages have a Portuguese twin; "/pt/admin" must not route around the admin check.
  if (locale === "pt" && /^\/(admin|api|media)(\/|$)/.test(path)) return NextResponse.redirect(new URL(path, req.url));
  if (locale === "en") {
    const chosen = req.cookies.get(LOCALE_COOKIE)?.value;
    const wanted = chosen ?? localeFromAcceptLanguage(req.headers.get("accept-language"));
    if (wanted === "pt" && !BOT.test(req.headers.get("user-agent") ?? "")) {
      const url = req.nextUrl.clone();
      url.pathname = localePath("pt", path);
      return NextResponse.redirect(url);
    }
  }

  const headers = new Headers(req.headers);
  headers.set(LOCALE_HEADER, locale);
  if (locale === "en") return NextResponse.next({ request: { headers } });
  const url = req.nextUrl.clone();
  url.pathname = path;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Pages only: not Next's assets, /.well-known (Flags Explorer), the API, uploads, feeds, metadata routes or files with an extension.
  matcher: ["/((?!_next/|\\.well-known/|api/|media/|og$|rss\\.xml|sitemap\\.xml|robots\\.txt|llms(?:-full)?\\.txt|.*\\.[a-z0-9]+$).*)"],
};
