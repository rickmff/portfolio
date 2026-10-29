/**
 * Halloween, every year. Delete this folder and grep "seasonal:halloween" to remove it.
 * The window is month-day, inclusive, in the visitor's local time: the week before through the
 * day after. `?holiday=force` shows it any day; "Hide" in the footer opts a visitor out.
 */
export const HOLIDAY = "halloween";

export const WINDOW = { start: "10-24", end: "11-01" };

const MD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const WINDOW_OK = MD.test(WINDOW.start) && MD.test(WINDOW.end);
if (!WINDOW_OK && process.env.NODE_ENV !== "production") {
  console.warn(`[seasonal:${HOLIDAY}] invalid WINDOW ${JSON.stringify(WINDOW)}; decorations stay off.`);
}

export const OPT_OUT_KEY = "seasonal-optout";
