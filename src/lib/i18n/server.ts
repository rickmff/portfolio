import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DICTS, LOCALE_COOKIE, LOCALE_HEADER, LOCALES, type Locale, localeFromAcceptLanguage } from "./dict";

/**
 * On the public site the URL decides (the middleware passes it on as a header), so every
 * language has its own crawlable address. Elsewhere (admin, feeds) the visitor's choice from
 * the footer toggle wins, then the browser language.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const fromUrl = (await headers()).get(LOCALE_HEADER);
  if (LOCALES.includes(fromUrl as Locale)) return fromUrl as Locale;
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (LOCALES.includes(chosen as Locale)) return chosen as Locale;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
});

export async function getDict() {
  return DICTS[await getLocale()];
}
