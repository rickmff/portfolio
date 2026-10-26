"use client";

import type { ReactNode } from "react";
import { useAtTop } from "@/lib/useAtTop";

/**
 * A heading that stays out of sight while the page is at the very top, like the work strip's
 * Desktop · Mobile switch, and fades in on the first scroll.
 */
export function HideAtTop({ children }: { children: ReactNode }) {
  const atTop = useAtTop();
  return (
    <h2 className={`hides-at-top${atTop ? " is-hidden" : ""}`} inert={atTop}>
      {children}
    </h2>
  );
}
