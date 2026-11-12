import { saveSettings } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { Area, FileField, Props, Section, Text } from "@/components/admin/Fields";
import type { IconName } from "@/components/admin/Icon";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { db, schema } from "@/db";
import { SETTING_KEYS, TRANSLATED_SETTINGS, type SettingKey } from "@/lib/settings";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
] as const;

const GROUPS: { title: string; icon: IconName; keys: SettingKey[] }[] = [
  { title: "Profile", icon: "user", keys: ["name", "role", "bio", "knowsAbout", "worksFor", "location"] },
  { title: "Home page", icon: "home", keys: ["hero", "heroBy", "heroByUrl", "now"] },
  { title: "Contact and links", icon: "link", keys: ["email", "github", "linkedin", "twitter", "discord", "cv"] },
];

const ICONS: Partial<Record<SettingKey, IconName>> = {
  name: "title",
  role: "user",
  knowsAbout: "tag",
  worksFor: "grid",
  location: "globe",
  hero: "quote",
  heroBy: "user",
  heroByUrl: "link",
  now: "clock",
  email: "user",
  github: "link",
  linkedin: "link",
  twitter: "link",
  discord: "link",
  cv: "file",
};

const LONG: SettingKey[] = ["bio", "knowsAbout", "hero", "now"];

/** "Short bio (one or two sentences …)" → a short property name and the rest as its hint. */
function splitLabel(label: string) {
  const i = label.indexOf(" (");
  return i < 0 ? { label } : { label: label.slice(0, i), hint: label.slice(i + 2).replace(/\)$/, "") };
}

export default async function SettingsPage() {
  // The raw rows, not the visitor-localised values the site reads.
  const rows = await db.select().from(schema.settings);
  const map: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const value = (key: string, lang?: string) =>
    (lang && map[`${key}:${lang}`]) || map[key] || SETTING_KEYS[key as SettingKey].fallback;

  const field = (key: SettingKey) => {
    const { label, hint } = splitLabel(SETTING_KEYS[key].label);
    const icon = ICONS[key] ?? (LONG.includes(key) ? "long" : "text");
    const Control = LONG.includes(key) ? Area : Text;
    if (key === "cv")
      return [
        <Text key={key} name={key} label="CV link" icon="link" defaultValue={value(key)} hint="Not shown on the public site." />,
        <FileField key="cvFile" name="cvFile" label="CV file" accept="application/pdf,.pdf" hint="Upload a PDF to replace the link." />,
      ];
    if (!TRANSLATED_SETTINGS.includes(key)) return <Control key={key} name={key} label={label} icon={icon} hint={hint} defaultValue={value(key)} />;
    return LANGS.map((l) => (
      <Control key={key + l.code} name={`${key}:${l.code}`} label={`${label} · ${l.label}`} icon={icon} hint={hint} defaultValue={value(key, l.code)} />
    ));
  };

  return (
    <AdminForm action={saveSettings} title="Settings">
      <h1 className="adm-title adm-title-static">Settings</h1>
      <p className="adm-lede">What the site says about you. Each line saves with the rest when you press Save.</p>
      {GROUPS.map((g) => (
        <Section key={g.title} title={g.title} icon={g.icon} open>
          <Props>{g.keys.map(field)}</Props>
        </Section>
      ))}
      {LANGS.map((l) => (
        <MarkdownField
          key={l.code}
          name={`about:${l.code}`}
          label={`About page · ${l.code === "en" ? "English" : "Português"}`}
          defaultValue={value("about", l.code)}
          blocks
        />
      ))}
    </AdminForm>
  );
}
