import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteBook, saveBook } from "@/app/admin/actions";
import { AdminForm, DeleteButton } from "@/components/admin/AdminForm";
import { Area, Color, ImageField, Row, Select, Text } from "@/components/admin/Fields";
import { db, schema } from "@/db";

export default async function EditBook({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [b] = isNew ? [undefined] : await db.select().from(schema.books).where(eq(schema.books.id, Number(id)));
  if (!isNew && !b) notFound();
  return (
    <>
      <header className="adm-head">
        <h1>{b ? b.title : "Add book"}</h1>
        {b ? <DeleteButton action={deleteBook.bind(null, b.id)} /> : null}
      </header>
      <AdminForm action={saveBook}>
        {b ? <input type="hidden" name="id" value={b.id} /> : null}
        <Row>
          <Text name="title" label="Title" defaultValue={b?.title} required />
          <Text name="author" label="Author" defaultValue={b?.author} required />
        </Row>
        <Row>
          <Select
            name="status"
            label="Status"
            defaultValue={b?.status ?? "read"}
            options={[
              { value: "reading", label: "Reading now" },
              { value: "read", label: "Read" },
              { value: "next", label: "Up next" },
              { value: "wishlist", label: "Wishlist (to buy)" },
              { value: "abandoned", label: "Put down" },
            ]}
          />
          <Text name="finishedYear" label="Year finished" type="number" defaultValue={b?.finishedYear} />
          <Text name="rating" label="Rating (1–5)" type="number" defaultValue={b?.rating} />
        </Row>
        <Area name="note" label="Your note" defaultValue={b?.note} rows={4} hint="Shown on the Books page under the 3D book." />
        <Row>
          <Color name="color" label="Cover colour" defaultValue={b?.color ?? "#1F3A5F"} />
          <Color name="ink" label="Text colour" defaultValue={b?.ink ?? "#FFFFFF"} />
          <Text name="thickness" label="Spine thickness (px)" type="number" defaultValue={b?.thickness ?? 36} hint="Roughly pages ÷ 10." />
          <Text name="sort" label="Order" type="number" defaultValue={b?.sort ?? 0} />
        </Row>
        <ImageField label="Cover image (optional, 11:16)" current={b?.coverUrl} />
      </AdminForm>
    </>
  );
}
