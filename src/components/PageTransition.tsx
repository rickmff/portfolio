"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const LEAVE_MS = 220;

type PrefetchKind = NonNullable<Parameters<AppRouterInstance["prefetch"]>[1]>["kind"];
// Pages here are rendered per request, so Next's default prefetch only fetches their shell.
// A full prefetch loads the whole page ahead of the click, which makes navigation instant.
const FULL = "full" as PrefetchKind;

/** Programmatic navigation with the same fade-out as link clicks. */
export function navigateWithTransition(router: AppRouterInstance, href: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return router.push(href);
  document.documentElement.classList.add("is-leaving");
  setTimeout(() => router.push(href), LEAVE_MS);
  setTimeout(() => document.documentElement.classList.remove("is-leaving"), 2500);
}

export const prefetchFull = (router: AppRouterInstance, href: string) => router.prefetch(href, { kind: FULL });

function internalPath(a: HTMLAnchorElement) {
  if (a.target || a.hasAttribute("download")) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null;
  if (/^\/(admin|api|media|_next|rss\.xml)/.test(url.pathname)) return null;
  return url;
}

/**
 * Makes moving between pages fast and smooth:
 * - prefetches internal links in full as they scroll into view or get hovered;
 * - fades the current page out briefly on click; the next page fades in via app/(site)/template.tsx.
 * Modified clicks, new tabs, downloads, same-page hash jumps and external links behave as usual.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.remove("is-leaving");
  }, [pathname]);

  // Prefetch
  useEffect(() => {
    const done = new Set<string>();
    const prefetch = (a: HTMLAnchorElement) => {
      const url = internalPath(a);
      if (!url || url.pathname === location.pathname) return;
      const key = url.pathname + url.search;
      if (done.has(key)) return;
      done.add(key);
      router.prefetch(key, { kind: FULL });
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) prefetch(e.target as HTMLAnchorElement);
    });
    const observe = () => document.querySelectorAll("a[href]").forEach((a) => io.observe(a));
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    idle(observe);
    const mo = new MutationObserver(() => idle(observe));
    mo.observe(document.body, { childList: true, subtree: true });
    const onIntent = (e: Event) => {
      const a = (e.target as Element).closest?.("a[href]");
      if (a) prefetch(a as HTMLAnchorElement);
    };
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);
    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("focusin", onIntent);
    };
  }, [router, pathname]);

  // Leave transition
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      const url = a && internalPath(a);
      if (!url) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page or hash jump
      e.preventDefault();
      document.documentElement.classList.add("is-leaving");
      setTimeout(() => router.push(url.pathname + url.search + url.hash), LEAVE_MS);
      clearTimeout(fallback);
      fallback = setTimeout(() => document.documentElement.classList.remove("is-leaving"), 2500);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimeout(fallback);
    };
  }, [router]);

  return null;
}
