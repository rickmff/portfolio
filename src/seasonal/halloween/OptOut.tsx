"use client";

import { useLocale } from "@/lib/i18n/client";
import { HOLIDAY, OPT_OUT_KEY } from "./config";

/** Footer switch, shown only while decorations are on: hides them now and for the rest of the season. */
export function HalloweenOptOut() {
  const pt = useLocale() === "pt";
  return (
    <button
      type="button"
      className="hw-optout"
      onClick={() => {
        try {
          localStorage.setItem(OPT_OUT_KEY, HOLIDAY);
        } catch {}
        document.documentElement.removeAttribute("data-holiday");
      }}
    >
      {pt ? "Esconder o Halloween" : "Hide Halloween"}
    </button>
  );
}
