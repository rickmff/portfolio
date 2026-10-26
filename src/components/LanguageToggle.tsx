"use client";

import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, LOCALES, localePath, splitLocale } from "@/lib/i18n/dict";
import { useDict, useLocale } from "@/lib/i18n/client";

/**
 * EN · PT switch in the footer: moves to the same page in the other language (each has its
 * own URL) and remembers the choice for a year, so unprefixed links send the visitor back to it.
 */
export function LanguageToggle() {
  const locale = useLocale();
  const t = useDict();
  const pathname = usePathname();
  return (
    <span className="lang-toggle" role="group" aria-label={t.language}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === locale}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
            if (l === locale) return;
            // A full load: the layouts are shared between languages, so a soft navigation would keep the old one.
            location.assign(localePath(l, splitLocale(pathname).path) + location.search + location.hash);
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </span>
  );
}
