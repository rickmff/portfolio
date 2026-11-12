import { MarkdownField } from "./MarkdownField";

type Base = { name: string; label: string; hint?: string };

export function Text({
  name,
  label,
  hint,
  defaultValue,
  required,
  type = "text",
  placeholder,
}: Base & { defaultValue?: string | number | null; required?: boolean; type?: string; placeholder?: string }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function Area({ name, label, hint, defaultValue, rows = 3 }: Base & { defaultValue?: string | null; rows?: number }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function Color({ name, label, defaultValue }: Base & { defaultValue: string }) {
  return (
    <label className="adm-field adm-color">
      <span>{label}</span>
      <input name={name} type="color" defaultValue={defaultValue} />
    </label>
  );
}

export function Check({ name, label, defaultChecked }: Base & { defaultChecked?: boolean }) {
  return (
    <label className="adm-check">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

export function Select({
  name,
  label,
  options,
  defaultValue,
}: Base & { options: { value: string; label: string }[]; defaultValue?: string }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function ImageField({ label, current }: { label: string; current?: string | null }) {
  return (
    <div className="adm-field">
      <span>{label}</span>
      {current ? (
        <div className="adm-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt="" />
          <label className="adm-check">
            <input type="checkbox" name="removeCover" />
            <span>Remove</span>
          </label>
        </div>
      ) : null}
      <input type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" />
    </div>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <div className="adm-row">{children}</div>;
}

type TrField = { name: string; label: string; rows?: number; markdown?: boolean; blocks?: boolean };
const LANGS = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
] as const;

/**
 * English and Portuguese versions of a row's text fields, saved into its translations. Each one
 * replaces the field above for visitors in that language; left empty, the field above shows.
 */
export function TranslationFields({
  fields,
  value,
}: {
  fields: TrField[];
  value?: Partial<Record<"en" | "pt", Record<string, string>>> | null;
}) {
  return (
    <div className="adm-tr">
      {LANGS.map((l) => {
        const filled = fields.filter((f) => value?.[l.code]?.[f.name]).length;
        return (
          <details key={l.code} className="adm-tr-lang" open={filled > 0}>
            <summary>
              {l.label} version <small>{filled ? `${filled}/${fields.length} filled` : "empty, shows the text above"}</small>
            </summary>
            {fields.map((f) =>
              f.markdown ? (
                <MarkdownField
                  key={f.name}
                  name={`tr.${l.code}.${f.name}`}
                  label={`${f.label} (${l.label})`}
                  defaultValue={value?.[l.code]?.[f.name] ?? ""}
                  blocks={f.blocks}
                />
              ) : (
                <Area
                  key={f.name}
                  name={`tr.${l.code}.${f.name}`}
                  label={`${f.label} (${l.label})`}
                  defaultValue={value?.[l.code]?.[f.name]}
                  rows={f.rows ?? 1}
                />
              ),
            )}
          </details>
        );
      })}
    </div>
  );
}
