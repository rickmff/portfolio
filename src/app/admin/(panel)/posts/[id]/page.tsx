import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePost, savePost } from "@/app/admin/actions";
import { AdminForm, DeleteButton } from "@/components/admin/AdminForm";
import { Area, Check, ImageField, Row, Text, TranslationFields } from "@/components/admin/Fields";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { db, schema } from "@/db";

/** datetime-local wants local "YYYY-MM-DDTHH:mm" without a zone. */
function toLocalInput(d: Date | null | undefined) {
  if (!d) return "";
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [p] = isNew ? [undefined] : await db.select().from(schema.posts).where(eq(schema.posts.id, Number(id)));
  if (!isNew && !p) notFound();
  return (
    <>
      <header className="adm-head">
        <h1>{p ? p.title : "Write post"}</h1>
        <div className="adm-head-actions">
          {p?.published ? <Link href={`/blog/${p.slug}`} target="_blank" className="adm-btn">View ↗</Link> : null}
          {p ? <DeleteButton action={deletePost.bind(null, p.id)} /> : null}
        </div>
      </header>
      <AdminForm action={savePost}>
        {p ? <input type="hidden" name="id" value={p.id} /> : null}
        <Row>
          <Text name="title" label="Title" defaultValue={p?.title} required />
          <Text name="slug" label="Slug" defaultValue={p?.slug} hint="Leave empty to generate from the title." />
        </Row>
        <Area name="excerpt" label="Excerpt" defaultValue={p?.excerpt} rows={2} hint="Used in RSS and link previews." />
        <ImageField label="Banner (wide, about 2:1; also shown when hovering the post on the blog list)" current={p?.bannerUrl} />
        <MarkdownField name="body" label="Body" defaultValue={p?.body} blocks />
        <TranslationFields
          value={p?.translations}
          fields={[
            { name: "title", label: "Title" },
            { name: "excerpt", label: "Excerpt", rows: 2 },
            { name: "body", label: "Body", markdown: true, blocks: true },
          ]}
        />
        <Row>
          <Text name="tags" label="Tags" defaultValue={p?.tags} placeholder="infra, product" />
          <Text name="publishedAt" label="Publish date" type="datetime-local" defaultValue={toLocalInput(p?.publishedAt)} hint="A future date schedules the post." />
        </Row>
        <Check name="published" label="Published" defaultChecked={p?.published ?? false} />
      </AdminForm>
    </>
  );
}
