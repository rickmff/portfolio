export const SETTING_KEYS = {
  name: { label: "Name", fallback: "Henrique Matos" },
  role: { label: "Role (small caps line)", fallback: "Fullstack developer" },
  hero: {
    label: "Hero sentence (wrap a word in **double asterisks** to emphasise it)",
    fallback:
      "I make software that feels **considered** — products, platforms and the small details between them.",
  },
  heroBy: { label: "Hero quote author (only when the hero sentence is a quote)", fallback: "" },
  heroByUrl: { label: "Hero quote source URL (optional)", fallback: "" },
  now: { label: "Now (what you are working on)", fallback: "" },
  email: { label: "Contact email", fallback: "" },
  github: { label: "GitHub URL", fallback: "https://github.com/rickmff" },
  linkedin: { label: "LinkedIn URL", fallback: "https://www.linkedin.com/in/rickmff/" },
  twitter: { label: "X / Twitter URL", fallback: "https://twitter.com/rickmff" },
  discord: { label: "Discord invite URL", fallback: "" },
  about: { label: "About page (Markdown)", fallback: "" },
} as const;

export type SettingKey = keyof typeof SETTING_KEYS;
export type SiteSettings = Record<SettingKey, string>;

/** Settings with an English and a Portuguese version (`key:en`, `key:pt`). */
export const TRANSLATED_SETTINGS: SettingKey[] = ["role", "hero", "now", "about"];
