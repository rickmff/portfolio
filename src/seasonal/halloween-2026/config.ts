/**
 * Halloween 2026: date window and surfaces. Delete this folder and grep "seasonal:halloween"
 * to remove it entirely. `SEASONAL=force` shows it outside the window, `SEASONAL=off` hides it.
 */
export const HOLIDAY = "halloween";

/** Inclusive, in Lisbon time. */
export const WINDOW = { start: "2026-10-24", end: "2026-10-31" };

export const SURFACES = { header: true, hero: true };

export function isHolidayActive(now = new Date()): boolean {
  const flag = process.env.SEASONAL;
  if (flag === "off") return false;
  if (flag === "force") return true;
  // en-CA formats as YYYY-MM-DD, so the window compares as strings.
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(now);
  return day >= WINDOW.start && day <= WINDOW.end;
}
