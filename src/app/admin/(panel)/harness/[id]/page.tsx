import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteHarnessItem, saveHarnessItem } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { TitleInput } from "@/components/admin/Controls";
import { Area, Props, Text, TranslationFields } from "@/components/admin/Fields";
import { db, schema } from "@/db";

export default async function EditHarnessItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [h] = isNew ? [undefined] : await db.select().from(schema.harness).where(eq(schema.harness.id, Number(id)));
  if (!isNew && !h) notFound();
  const categories = [...new Set((await db.select({ c: schema.harness.category }).from(schema.harness)).map((r) => r.c).filter(Boolean))];
  return (
    <AdminForm
      action={saveHarnessItem}
      crumb={{ href: "/admin/harness", label: "Harness" }}
      title={h?.name ?? "New link"}
      viewHref={h ? h.url : undefined}
      deleteAction={h ? deleteHarnessItem.bind(null, h.id) : undefined}
    >
      {h ? <input type="hidden" name="id" value={h.id} /> : null}
      <TitleInput name="name" defaultValue={h?.name} placeholder="Tool name" required />
      <Props>
        <Text name="url" label="Link" type="url" defaultValue={h?.url} placeholder="https://" required />
        <Area name="description" label="What you use it for" defaultValue={h?.description} hint="One short line." />
        <Text
          name="category"
          label="Category"
          icon="tag"
          defaultValue={h?.category}
          list="adm-categories"
          placeholder="Editor, AI, Infra, Hardware…"
          hint={categories.length ? `Pick an existing one or type a new one.` : undefined}
        />
        <Text name="sort" label="Order" type="number" icon="list" defaultValue={h?.sort ?? 0} />
      </Props>
      <datalist id="adm-categories">
        {categories.map((c) => (
          <option key={c} value={c!} />
        ))}
      </datalist>
      <TranslationFields
        value={h?.translations}
        fields={[
          { name: "description", label: "What you use it for", rows: 2 },
          { name: "category", label: "Category" },
        ]}
      />
    </AdminForm>
  );
}
