import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deletePost, savePost } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { TitleInput } from "@/components/admin/Controls";
import { Area, Check, ImageField, Props, Text, TranslationFields } from "@/components/admin/Fields";
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
    <AdminForm
      action={savePost}
      crumb={{ href: "/admin/posts", label: "Posts" }}
      title={p?.title ?? "New post"}
      viewHref={p?.published ? `/blog/${p.slug}` : undefined}
      deleteAction={p ? deletePost.bind(null, p.id) : undefined}
    >
      {p ? <input type="hidden" name="id" value={p.id} /> : null}
      <TitleInput name="title" defaultValue={p?.title} placeholder="Untitled post" required />
      <Props>
        <Check name="published" label="Published" icon="globe" defaultChecked={p?.published ?? false} />
        <Text name="publishedAt" label="Publish date" type="datetime-local" defaultValue={toLocalInput(p?.publishedAt)} hint="A future date schedules the post." />
        <Text name="tags" label="Tags" icon="tag" defaultValue={p?.tags} placeholder="infra, product" />
        <Text name="slug" label="Slug" icon="link" defaultValue={p?.slug} placeholder="From the title" hint="Leave empty to generate from the title." />
        <Area name="excerpt" label="Excerpt" defaultValue={p?.excerpt} hint="Used in RSS and link previews." />
        <ImageField label="Banner" current={p?.bannerUrl} hint="Wide, about 2:1. Also shown when hovering the post on the blog list." />
      </Props>
      <MarkdownField name="body" label="Body" defaultValue={p?.body} blocks />
      <TranslationFields
        value={p?.translations}
        fields={[
          { name: "title", label: "Title" },
          { name: "excerpt", label: "Excerpt", rows: 2 },
          { name: "body", label: "Body", markdown: true, blocks: true },
        ]}
      />
    </AdminForm>
  );
}
