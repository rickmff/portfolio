import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteBook, saveBook } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { BookLookup } from "@/components/admin/BookLookup";
import { TitleInput } from "@/components/admin/Controls";
import { Area, Check, Color, ImageField, Props, Section, Select, Text, TranslationFields } from "@/components/admin/Fields";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { bookHref } from "@/lib/books";
import { db, schema } from "@/db";

export default async function EditBook({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [b] = isNew ? [undefined] : await db.select().from(schema.books).where(eq(schema.books.id, Number(id)));
  if (!isNew && !b) notFound();
  return (
    <AdminForm
      action={saveBook}
      crumb={{ href: "/admin/books", label: "Books" }}
      title={b?.title ?? "New book"}
      viewHref={b ? bookHref(b) : undefined}
      deleteAction={b ? deleteBook.bind(null, b.id) : undefined}
    >
      {b ? <input type="hidden" name="id" value={b.id} /> : null}
      <BookLookup />
      <TitleInput name="title" defaultValue={b?.title} placeholder="Untitled book" required />
      <Props>
        <Text name="author" label="Author" icon="user" defaultValue={b?.author} required />
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
        <Text name="finishedYear" label="Year finished" type="number" icon="calendar" defaultValue={b?.finishedYear} />
        <Select
          name="rating"
          label="Rating"
          icon="star"
          defaultValue={b?.rating ? String(b.rating) : ""}
          options={[
            { value: "", label: "No rating" },
            ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: "★".repeat(n) + "☆".repeat(5 - n) })),
          ]}
        />
        <Area name="note" label="Your note" defaultValue={b?.note} hint="Shown on the Books page under the 3D book." />
        <Area name="synopsis" label="Synopsis" defaultValue={b?.synopsis} hint="Spoiler-free. Shown on the book page above your notes." />
        <Area
          name="quote"
          label="Quote"
          icon="quote"
          defaultValue={b?.quote}
          hint="The book's most famous line, word for word. Highlighted when the book is picked off the shelf, on the book page and on /quotes."
        />
        <Text name="quoteSource" label="Where it is" icon="book" defaultValue={b?.quoteSource} placeholder="Act III, Scene 1" />
        <Text name="readUrl" label="Free edition" type="url" defaultValue={b?.readUrl} placeholder="https://" hint="Only public-domain or official free editions." />
      </Props>

      <Section title="Cover and spine" icon="color" open={isNew} note="How the 3D book looks">
        <Props>
          <ImageField label="Cover image" current={b?.coverUrl} hint="Optional, 11:16." />
          <Color name="color" label="Cover colour" defaultValue={b?.color ?? "#1F3A5F"} />
          <Color name="ink" label="Text colour" defaultValue={b?.ink ?? "#FFFFFF"} />
          <Text name="thickness" label="Spine (px)" type="number" defaultValue={b?.thickness ?? 36} hint="Roughly pages ÷ 10." />
          <Text name="sort" label="Order" type="number" icon="list" defaultValue={b?.sort ?? 0} />
        </Props>
      </Section>

      {b?.notesGenerated ? (
        <p className="adm-flag">These notes were drafted for you in your style, not written by you. Rewrite them and switch off “Generated draft” below.</p>
      ) : null}
      <MarkdownField name="notes" label="Reading notes · hidden until the reader clicks Reveal" defaultValue={b?.notes ?? ""} blocks />
      <Props>
        <Check name="notesGenerated" label="Generated draft" icon="pen" defaultChecked={b?.notesGenerated ?? false} hint="Marks notes drafted for you. Switch it off once you rewrite them." />
      </Props>
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
    </AdminForm>
  );
}
