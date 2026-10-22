import { saveSettings } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { Area, Text } from "@/components/admin/Fields";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { getSettings } from "@/lib/data";
import { SETTING_KEYS, type SettingKey } from "@/lib/settings";

export default async function SettingsPage() {
  const values = await getSettings();
  return (
    <>
      <header className="adm-head"><h1>Settings</h1></header>
      <AdminForm action={saveSettings}>
        {(Object.keys(SETTING_KEYS) as SettingKey[]).map((key) =>
          key === "about" ? (
            <MarkdownField key={key} name={key} label={SETTING_KEYS[key].label} defaultValue={values[key]} />
          ) : key === "hero" || key === "now" ? (
            <Area key={key} name={key} label={SETTING_KEYS[key].label} defaultValue={values[key]} rows={3} />
          ) : (
            <Text key={key} name={key} label={SETTING_KEYS[key].label} defaultValue={values[key]} />
          ),
        )}
      </AdminForm>
    </>
  );
}
