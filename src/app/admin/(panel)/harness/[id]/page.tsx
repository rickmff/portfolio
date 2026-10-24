import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteHarnessItem, saveHarnessItem } from "@/app/admin/actions";
import { AdminForm, DeleteButton } from "@/components/admin/AdminForm";
import { Area, Row, Text, TranslationFields } from "@/components/admin/Fields";
import { db, schema } from "@/db";

export default async function EditHarnessItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [h] = isNew ? [undefined] : await db.select().from(schema.harness).where(eq(schema.harness.id, Number(id)));
  if (!isNew && !h) notFound();
  const categories = [...new Set((await db.select({ c: schema.harness.category }).from(schema.harness)).map((r) => r.c).filter(Boolean))];
  return (
    <>
      <header className="adm-head">
        <h1>{h ? h.name : "Add link"}</h1>
        {h ? <DeleteButton action={deleteHarnessItem.bind(null, h.id)} /> : null}
      </header>
      <AdminForm action={saveHarnessItem}>
        {h ? <input type="hidden" name="id" value={h.id} /> : null}
        <Row>
          <Text name="name" label="Name" defaultValue={h?.name} required />
          <Text name="url" label="Link" type="url" defaultValue={h?.url} required />
        </Row>
        <Area name="description" label="What you use it for" defaultValue={h?.description} rows={2} hint="One short line." />
        <Row>
          <Text
            name="category"
            label="Category"
            defaultValue={h?.category}
            hint={categories.length ? `Existing: ${categories.join(", ")}` : "e.g. Editor, AI, Infra, Hardware"}
          />
          <Text name="sort" label="Order" type="number" defaultValue={h?.sort ?? 0} />
        </Row>
        <TranslationFields
          value={h?.translations}
          fields={[
            { name: "description", label: "What you use it for", rows: 2 },
            { name: "category", label: "Category" },
          ]}
        />
      </AdminForm>
    </>
  );
}
