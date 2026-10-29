"use client";

import { type CSSProperties, useLayoutEffect, useMemo, useRef } from "react";
import type { ContributionDay } from "@/lib/github";
import { useDict } from "@/lib/i18n/client";

const parse = (date: string) => new Date(`${date}T00:00:00Z`);

/**
 * The GitHub contribution calendar, drawn from our own copy of the data: one column per week,
 * Sunday at the top. Hovering a day shows its count.
 */
export function ContributionGraph({ days, total }: { days: ContributionDay[]; total: number }) {
  const t = useDict();
  const scroller = useRef<HTMLDivElement>(null);

  const { weeks, months } = useMemo(() => {
    const weeks: (number | null)[][] = [];
    days.forEach((d, i) => {
      const dow = parse(d.date).getUTCDay();
      if (!weeks.length || dow === 0) weeks.push(Array(7).fill(null));
      weeks[weeks.length - 1][dow] = i;
    });
    // A month is named over the first week that holds its 1st, unless that would crowd the last label.
    const monthFmt = new Intl.DateTimeFormat(t.intl, { month: "short", timeZone: "UTC" });
    const months = new Map<number, string>();
    let last = -3;
    weeks.forEach((w, c) => {
      const first = w.find((i) => i !== null && parse(days[i].date).getUTCDate() === 1);
      const start = c === 0 ? (first ?? w.find((i) => i !== null)) : first;
      if (start == null || c - last < 3) return;
      // The opening partial week only gets a label if the month runs on for a while after it.
      if (c === 0 && parse(days[start].date).getUTCDate() > 14) return;
      months.set(c, monthFmt.format(parse(days[start].date)).replace(".", ""));
      last = c;
    });
    return { weeks, months };
  }, [days, t.intl]);

  // Today sits at the right edge: on a narrow screen, start scrolled there.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const longDate = new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const summary = t.home.contributionsYear(total.toLocaleString(t.intl));

  return (
    // ScrollReveal can get to this before hydration does (it streams in behind a Suspense).
    <figure className="gh" suppressHydrationWarning>
      <div className="gh-scroll" ref={scroller}>
        <div className="gh-cal" role="img" aria-label={summary}>
          <div className="gh-weeks" aria-hidden="true">
            {weeks.map((w, c) => (
              <div key={c} className="gh-week" style={{ "--c": c } as CSSProperties}>
                <span className="gh-month">{months.get(c)}</span>
                {w.map((i, dow) =>
                  i === null ? (
                    <span key={dow} className="gh-pad" />
                  ) : (
                    <span
                      key={dow}
                      className="gh-day"
                      data-level={days[i].level}
                      title={t.home.contributionsDay(days[i].count, longDate.format(parse(days[i].date)))}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
