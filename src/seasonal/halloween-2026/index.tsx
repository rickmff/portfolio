import "./tokens.css";
import { HOLIDAY, isHolidayActive } from "./config";
import { HalloweenHeader, HalloweenHero } from "./Decorations";

/** Value for <html data-holiday>, or undefined outside the window so the attribute is omitted. */
export function holidayAttr(): string | undefined {
  return isHolidayActive() ? HOLIDAY : undefined;
}

export function SeasonalHeader() {
  return isHolidayActive() ? <HalloweenHeader /> : null;
}

export function SeasonalHero() {
  return isHolidayActive() ? <HalloweenHero /> : null;
}
