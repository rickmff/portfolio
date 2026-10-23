"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, LOCALES } from "@/lib/i18n/dict";
import { useDict, useLocale } from "@/lib/i18n/client";

/** EN · PT switch in the footer. The choice is remembered for a year and overrides the browser language. */
export function LanguageToggle() {
  const locale = useLocale();
  const t = useDict();
  const router = useRouter();
  return (
    <span className="lang-toggle" role="group" aria-label={t.language}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === locale}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
            router.refresh();
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </span>
  );
}
