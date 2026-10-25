"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/i18n/dict";
import { useLocale } from "@/lib/i18n/client";

/** `next/link` that keeps the visitor in their language: "/books" becomes "/pt/books" on the Portuguese site. */
export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const locale = useLocale();
  return <Link href={typeof href === "string" ? localePath(locale, href) : href} {...props} />;
}
