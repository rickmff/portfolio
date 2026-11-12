import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBook, saveBook } from "@/app/admin/actions";
import { AdminForm, DeleteButton } from "@/components/admin/AdminForm";
import { BookLookup } from "@/components/admin/BookLookup";
import { Area, Check, Color, ImageField, Row, Select, Text, TranslationFields } from "@/components/admin/Fields";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { bookHref } from "@/lib/books";
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
        {b ? (
          <div className="adm-head-actions">
            <Link href={bookHref(b)} target="_blank" className="adm-btn">View ↗</Link>
            <DeleteButton action={deleteBook.bind(null, b.id)} />
          </div>
        ) : null}
      </header>
      <AdminForm action={saveBook}>
        {b ? <input type="hidden" name="id" value={b.id} /> : null}
        <BookLookup />
        <Row>
          <Text name="title" label="Title" defaultValue={b?.title} required />
          <Text name="author" label="Author" defaultValue={b?.author} required />
        </Row>
        <Row>
          <Select
            name="status"
            label="Status"
            defaultValue={b?.status === "next" ? "wishlist" : (b?.status ?? "read")}
            options={[
              { value: "reading", label: "Reading now" },
              { value: "read", label: "Read" },
              { value: "wishlist", label: "Waitlist" },
              { value: "abandoned", label: "Put down" },
            ]}
          />
          <Text name="finishedYear" label="Year finished" type="number" defaultValue={b?.finishedYear} />
          <Text name="rating" label="Rating (1–5)" type="number" defaultValue={b?.rating} />
        </Row>
        <Area name="note" label="Your note" defaultValue={b?.note} rows={4} hint="Shown on the Books page under the 3D book." />
        <Area name="synopsis" label="Synopsis" defaultValue={b?.synopsis} rows={4} hint="Spoiler-free. Shown on the book page above your notes." />
        <Area
          name="quote"
          label="Quote"
          defaultValue={b?.quote}
          rows={3}
          hint="The book's most famous line, word for word. Highlighted when the book is picked off the shelf, on the book page and on /quotes."
        />
        <Text name="quoteSource" label="Where it is" defaultValue={b?.quoteSource} hint="Optional, e.g. Act III, Scene 1 or Chapter 21." />
        <MarkdownField name="notes" label="Reading notes (hidden until the reader clicks Reveal)" defaultValue={b?.notes ?? ""} blocks />
        {b?.notesGenerated ? (
          <p className="adm-flag">These notes were drafted for you in your style, not written by you. Rewrite them and untick the box below.</p>
        ) : null}
        <TranslationFields
          value={b?.translations}
          fields={[
            { name: "title", label: "Title" },
            { name: "note", label: "Your note", rows: 3 },
            { name: "synopsis", label: "Synopsis", rows: 4 },
            { name: "quote", label: "Quote", rows: 3 },
            { name: "quoteSource", label: "Where it is" },
            { name: "notes", label: "Reading notes", markdown: true, blocks: true },
          ]}
        />
        <Check name="notesGenerated" label="Notes are a generated draft" defaultChecked={b?.notesGenerated ?? false} />
        <Text name="readUrl" label="Free edition link" defaultValue={b?.readUrl} hint="Only public-domain or official free editions." />
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
