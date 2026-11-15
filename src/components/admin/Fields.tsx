import { AutoTextarea, ColorPick, FilePick, LangTabs, TitleInput } from "./Controls";
import { DateTimePicker } from "./DateTimePicker";
import { Icon, type IconName } from "./Icon";
import { MarkdownField } from "./MarkdownField";

/*
 * Notion-style page parts: a big title, then properties as rows (icon and name on the left, an
 * inline value on the right that only shows a field when you hover or focus it), then toggles
 * and the body. Field names are unchanged, so the server actions read the same form data.
 */

type Base = { name: string; label: string; hint?: string; icon?: IconName };

const idFor = (name: string) => `f-${name.replace(/[^\w-]/g, "-")}`;

/** One property row. `hint` shows under the value while it has focus. */
export function Prop({
  label,
  icon = "text",
  hint,
  htmlFor,
  children,
}: {
  label: string;
  icon?: IconName;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="adm-prop">
      <label className="adm-prop-k" htmlFor={htmlFor}>
        <Icon name={icon} />
        <span>{label}</span>
      </label>
      <div className="adm-prop-v">
        {children}
        {hint ? <small className="adm-hint">{hint}</small> : null}
      </div>
    </div>
  );
}

/** A list of properties under the title. */
export function Props({ children }: { children: React.ReactNode }) {
  return <div className="adm-props">{children}</div>;
}

const TYPE_ICON: Record<string, IconName> = { number: "hash", url: "link", "datetime-local": "calendar", email: "user" };

export function Text({
  name,
  label,
  hint,
  icon,
  defaultValue,
  required,
  type = "text",
  placeholder = "Empty",
  list,
  step,
  min,
}: Base & {
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  placeholder?: string;
  list?: string;
  step?: string;
  min?: string;
}) {
  const id = idFor(name);
  return (
    <Prop label={label} icon={icon ?? TYPE_ICON[type] ?? "text"} hint={hint} htmlFor={id}>
      <input
        id={id}
        className="adm-pv"
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        list={list}
        step={step}
        min={min}
      />
    </Prop>
  );
}

export function Area({ name, label, hint, icon = "long", defaultValue, placeholder = "Empty" }: Base & { defaultValue?: string | null; rows?: number; placeholder?: string }) {
  const id = idFor(name);
  return (
    <Prop label={label} icon={icon} hint={hint} htmlFor={id}>
      <AutoTextarea id={id} className="adm-pv" name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} spellCheck />
    </Prop>
  );
}

export function Color({ name, label, hint, defaultValue }: Base & { defaultValue: string }) {
  const id = idFor(name);
  return (
    <Prop label={label} icon="color" hint={hint} htmlFor={id}>
      <ColorPick id={id} name={name} defaultValue={defaultValue} />
    </Prop>
  );
}

/** A date and time, picked with the shadcn date picker. `defaultValue` is "YYYY-MM-DDTHH:mm" local time. */
export function DateTime({ name, label, hint, icon = "calendar", defaultValue }: Base & { defaultValue?: string }) {
  const id = idFor(name);
  return (
    <Prop label={label} icon={icon} hint={hint} htmlFor={id}>
      <DateTimePicker id={id} name={name} defaultValue={defaultValue} />
    </Prop>
  );
}

/** A switch, in a property row. */
export function Check({ name, label, hint, icon = "check", defaultChecked }: Base & { defaultChecked?: boolean }) {
  const id = idFor(name);
  return (
    <Prop label={label} icon={icon} hint={hint} htmlFor={id}>
      <label className="adm-switch">
        <input id={id} name={name} type="checkbox" role="switch" defaultChecked={defaultChecked} />
        <span aria-hidden="true" />
      </label>
    </Prop>
  );
}

export function Select({
  name,
  label,
  hint,
  icon = "select",
  options,
  defaultValue,
}: Base & { options: { value: string; label: string; tone?: string }[]; defaultValue?: string }) {
  const id = idFor(name);
  return (
    <Prop label={label} icon={icon} hint={hint} htmlFor={id}>
      <select id={id} name={name} defaultValue={defaultValue} className="adm-pv adm-select">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Prop>
  );
}

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif,image/gif";

/** The row's cover image (input `cover`, remove switch `removeCover`). */
export function ImageField({ label, hint, current }: { label: string; hint?: string; current?: string | null }) {
  return (
    <Prop label={label} icon="image" hint={hint} htmlFor="f-cover">
      <FilePick id="f-cover" name="cover" accept={IMAGE_TYPES} current={current} kind="image" removeName="removeCover" />
    </Prop>
  );
}

/** Any other upload. */
export function FileField({
  name,
  label,
  hint,
  icon = "file",
  accept,
  current,
  kind = "file",
  removeName,
  removeLabel,
}: Base & { accept?: string; current?: string | null; kind?: "image" | "file"; removeName?: string; removeLabel?: string }) {
  const id = idFor(name);
  return (
    <Prop label={label} icon={icon} hint={hint} htmlFor={id}>
      <FilePick id={id} name={name} accept={accept} current={current} kind={kind} removeName={removeName} removeLabel={removeLabel} />
    </Prop>
  );
}

/** Kept for older call sites: properties stack one per row now. */
export function Row({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** A Notion toggle heading that folds a group of properties away. */
export function Section({
  title,
  icon,
  open = false,
  note,
  children,
}: {
  title: string;
  icon?: IconName;
  open?: boolean;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="adm-sec" open={open}>
      <summary>
        <span className="adm-caret" aria-hidden="true" />
        {icon ? <Icon name={icon} /> : null}
        <span>{title}</span>
        {note ? <small>{note}</small> : null}
      </summary>
      <div className="adm-sec-body">{children}</div>
    </details>
  );
}

type TrField = { name: string; label: string; rows?: number; markdown?: boolean; blocks?: boolean };
const LANGS = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
] as const;

/**
 * The page in tabs: the original text, then its English and Portuguese versions, saved into the
 * row's translations. Each version replaces the original for visitors in that language; an empty
 * field shows the original.
 */
export function TranslationFields({
  fields,
  value,
  children,
}: {
  fields: TrField[];
  value?: Partial<Record<"en" | "pt", Record<string, string>>> | null;
  /** The original page: title, properties and body. */
  children: React.ReactNode;
}) {
  const titleField = fields.find((f) => f.name === "title" || f.name === "name");
  const tabs = [
    { id: "base", label: "Original" },
    ...LANGS.map((l) => {
      const filled = fields.filter((f) => value?.[l.code]?.[f.name]).length;
      return { id: l.code, label: l.label, note: `${filled}/${fields.length}`, filled: filled > 0 };
    }),
  ];
  const panels = [
    children,
    ...LANGS.map((l) => (
      <div key={l.code} className="adm-tr-page">
        {titleField ? (
          <TitleInput name={`tr.${l.code}.${titleField.name}`} defaultValue={value?.[l.code]?.[titleField.name]} placeholder={`${l.label} title`} autoFocus={false} />
        ) : null}
        <p className="adm-lede">Empty fields show the Original text to {l.label} readers.</p>
        <Props>
          {fields
            .filter((f) => !f.markdown && f !== titleField)
            .map((f) =>
              f.rows && f.rows > 1 ? (
                <Area key={f.name} name={`tr.${l.code}.${f.name}`} label={f.label} defaultValue={value?.[l.code]?.[f.name]} />
              ) : (
                <Text key={f.name} name={`tr.${l.code}.${f.name}`} label={f.label} defaultValue={value?.[l.code]?.[f.name]} />
              ),
            )}
        </Props>
        {fields
          .filter((f) => f.markdown)
          .map((f) => (
            <MarkdownField
              key={f.name}
              name={`tr.${l.code}.${f.name}`}
              label={`${f.label} · ${l.label}`}
              defaultValue={value?.[l.code]?.[f.name] ?? ""}
              blocks={f.blocks}
            />
          ))}
      </div>
    )),
  ];
  return <LangTabs tabs={tabs} panels={panels} />;
}
