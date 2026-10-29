import "./tokens.css";
import { GATE_SCRIPT } from "./gate";

export { NatalHolly, NatalSnow } from "./Decorations";

/** Goes in <head>, before paint. */
export function NatalGate() {
  return GATE_SCRIPT ? <script dangerouslySetInnerHTML={{ __html: GATE_SCRIPT }} /> : null;
}
