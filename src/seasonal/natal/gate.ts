import { HOLIDAY, OPT_OUT_KEY, WINDOW, WINDOW_OK } from "./config";

/**
 * Inline <head> script, run once before paint. Sets <html data-holiday> when the visitor's local
 * date is in the window (or `?holiday=force`), unless they opted out. Fails closed.
 */
export const GATE_SCRIPT = WINDOW_OK
  ? `(function(){try{var h=${JSON.stringify(HOLIDAY)},s=${JSON.stringify(WINDOW.start)},e=${JSON.stringify(WINDOW.end)};` +
    `if(new URLSearchParams(location.search).get("holiday")!=="force"){` +
    `try{if(localStorage.getItem(${JSON.stringify(OPT_OUT_KEY)})===h)return}catch(_){}` +
    `var n=new Date(),m=("0"+(n.getMonth()+1)).slice(-2)+"-"+("0"+n.getDate()).slice(-2);` +
    `if(s<=e?(m<s||m>e):(m<s&&m>e))return}` +
    `document.documentElement.setAttribute("data-holiday",h)}catch(_){}})()`
  : "";
