export const SETTING_KEYS = {
  name: { label: "Name", fallback: "Henrique Matos" },
  role: { label: "Role (small caps line)", fallback: "Fullstack developer" },
  bio: {
    label: "Short bio (one or two sentences — the description search engines, social cards and AI assistants use)",
    fallback:
      "Fullstack developer with ten years of shipping software, now focused on building software with AI and agents.",
  },
  knowsAbout: {
    label: "Expertise (comma-separated topics you want to be known for)",
    fallback: "Software development, AI-assisted development, AI agents, Fullstack development, TypeScript, React, Next.js",
  },
  worksFor: { label: "Current company (optional)", fallback: "" },
  location: { label: "Location (optional, e.g. Lisbon, Portugal)", fallback: "" },
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
export const TRANSLATED_SETTINGS: SettingKey[] = ["role", "bio", "hero", "now", "about"];
