import { saveSettings } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { Area, Row, Text } from "@/components/admin/Fields";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { db, schema } from "@/db";
import { SETTING_KEYS, TRANSLATED_SETTINGS, type SettingKey } from "@/lib/settings";

const LANGS = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
] as const;

export default async function SettingsPage() {
  // The raw rows, not the visitor-localised values the site reads.
  const rows = await db.select().from(schema.settings);
  const map: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const value = (key: string, lang?: string) =>
    (lang && map[`${key}:${lang}`]) || map[key] || SETTING_KEYS[key as SettingKey].fallback;

  return (
    <>
      <header className="adm-head"><h1>Settings</h1></header>
      <AdminForm action={saveSettings}>
        {(Object.keys(SETTING_KEYS) as SettingKey[]).map((key) => {
          const label = SETTING_KEYS[key].label;
          if (key === "cv")
            return (
              <div key={key}>
                <Text name={key} label={label} defaultValue={value(key)} />
                <input type="file" name="cvFile" accept="application/pdf,.pdf" aria-label="Upload CV (PDF)" />
              </div>
            );
          if (!TRANSLATED_SETTINGS.includes(key)) return <Text key={key} name={key} label={label} defaultValue={value(key)} />;
          if (key === "about")
            return LANGS.map((l) => (
              <MarkdownField key={key + l.code} name={`${key}:${l.code}`} label={`${label} (${l.label})`} defaultValue={value(key, l.code)} blocks />
            ));
          return (
            <Row key={key}>
              {LANGS.map((l) =>
                key === "role" ? (
                  <Text key={l.code} name={`${key}:${l.code}`} label={`${label} (${l.label})`} defaultValue={value(key, l.code)} />
                ) : (
                  <Area key={l.code} name={`${key}:${l.code}`} label={`${label} (${l.label})`} defaultValue={value(key, l.code)} rows={3} />
                ),
              )}
            </Row>
          );
        })}
      </AdminForm>
    </>
  );
}
