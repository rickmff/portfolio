import "./tokens.css";
import "./motion.css";
import { GATE_SCRIPT } from "./gate";

export { HalloweenSpider, HalloweenBats } from "./Decorations";
export { HalloweenOptOut } from "./OptOut";

/** Goes in <head>, before paint. */
export function HalloweenGate() {
  return GATE_SCRIPT ? <script dangerouslySetInnerHTML={{ __html: GATE_SCRIPT }} /> : null;
}
