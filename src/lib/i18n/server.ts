import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DICTS, LOCALE_COOKIE, LOCALES, type Locale, localeFromAcceptLanguage } from "./dict";

/** The visitor's choice (footer toggle) wins; otherwise the browser language decides. */
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (LOCALES.includes(chosen as Locale)) return chosen as Locale;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
});

export async function getDict() {
  return DICTS[await getLocale()];
}
