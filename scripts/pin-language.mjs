// Films come out in one language (English by default, --lang pt for Portuguese, --lang any to
// leave the site alone). Shared by capture-project.mjs and showcase-project.mjs.
//   1. The browser asks for the language: locale, Accept-Language and navigator.languages.
//   2. The usual places sites keep a chosen language are preset: cookies and localStorage.
//   3. After loading, if <html lang> is still another language, the site's own switcher is tried
//      (a link with hreflang, a button or link named after the language, a <select>).
//   4. If the page still isn't in the language, filming stops with an error instead of
//      recording the wrong one; pin it by hand with --cookie, or pass a language-specific URL.

const NAMES = {
  en: /^(en|eng|en-us|english|inglês|ingles|🇺🇸|🇬🇧)$/i,
  pt: /^(pt|pt-br|br|português|portugues|portuguese|🇧🇷)$/i,
};
const LOCALES = { en: "en-US", pt: "pt-BR" };
const KEYS = [
  "NEXT_LOCALE",
  "locale",
  "lang",
  "language",
  "i18next",
  "i18nextLng",
  "i18n_redirected",
];

/** Browser context options that ask for the language. */
export function languageContext(lang) {
  if (lang === "any") return {};
  const locale = LOCALES[lang] ?? lang;
  return {
    locale,
    extraHTTPHeaders: { "Accept-Language": `${locale},${lang};q=0.9` },
  };
}

/** Presets the language in cookies and localStorage before the page loads. */
export async function presetLanguage(page, target, lang) {
  if (lang === "any") return;
  await page
    .context()
    .addCookies(KEYS.map((name) => ({ name, value: lang, url: target })));
  await page.addInitScript(
    ([keys, lang]) => {
      try {
        for (const k of keys)
          if (!localStorage.getItem(k)) localStorage.setItem(k, lang);
      } catch {}
    },
    [KEYS, lang],
  );
}

const pageLang = (page) =>
  page.evaluate(() => document.documentElement.lang || "");
const matches = (value, lang) => value.toLowerCase().split(/[-_]/)[0] === lang;

/** Makes sure the loaded page is in the language, using its own switcher when it isn't yet. */
export async function ensureLanguage(page, lang) {
  if (lang === "any") return;
  const before = await pageLang(page);
  if (!before || matches(before, lang)) {
    if (!before)
      console.warn(`  page has no <html lang>; check the film is in "${lang}"`);
    return;
  }
  const settle = () =>
    page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  const tries = [
    page.locator(`a[hreflang^="${lang}" i]`).first(),
    page.getByRole("link", { name: NAMES[lang], exact: true }).first(),
    page.getByRole("button", { name: NAMES[lang], exact: true }).first(),
  ];
  for (const el of tries) {
    if (!(await el.isVisible().catch(() => false))) continue;
    await el.click({ timeout: 2000 }).catch(() => {});
    await settle();
    if (matches(await pageLang(page), lang)) return;
  }
  // A <select> switcher.
  const picked = await page
    .evaluate((lang) => {
      for (const s of document.querySelectorAll("select")) {
        const o = [...s.options].find(
          (o) => o.value.toLowerCase().split(/[-_]/)[0] === lang,
        );
        if (o) {
          s.value = o.value;
          s.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
      }
      return false;
    }, lang)
    .catch(() => false);
  if (picked) {
    await settle();
    if (matches(await pageLang(page), lang)) return;
  }
  throw new Error(
    `The page is in "${await pageLang(page)}", not "${lang}". Pin the language with --cookie NAME=${lang}, ` +
      `pass the site's ${lang} URL, or use --lang any to film it as it is.`,
  );
}
