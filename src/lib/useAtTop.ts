"use client";

import { useEffect, useState } from "react";

/** True while the page sits at the very top (and `enabled`), false once it scrolls. */
export function useAtTop(enabled = true) {
  const [atTop, setAtTop] = useState(enabled);
  useEffect(() => {
    if (!enabled) return setAtTop(false);
    const update = () => setAtTop(window.scrollY < 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [enabled]);
  return atTop;
}
