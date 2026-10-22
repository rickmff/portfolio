import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProject, saveProject } from "@/app/admin/actions";
import { AdminForm, DeleteButton } from "@/components/admin/AdminForm";
import { Area, Check, Color, ImageField, Row, Text } from "@/components/admin/Fields";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { db, schema } from "@/db";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [p] = isNew ? [undefined] : await db.select().from(schema.projects).where(eq(schema.projects.id, Number(id)));
  if (!isNew && !p) notFound();
  return (
    <>
      <header className="adm-head">
        <h1>{p ? p.title : "New project"}</h1>
        <div className="adm-head-actions">
          {p ? <Link href={`/work/${p.slug}`} target="_blank" className="adm-btn">View ↗</Link> : null}
          {p ? <DeleteButton action={deleteProject.bind(null, p.id)} /> : null}
        </div>
      </header>
      <AdminForm action={saveProject}>
        {p ? <input type="hidden" name="id" value={p.id} /> : null}
        <Row>
          <Text name="title" label="Title" defaultValue={p?.title} required />
          <Text name="slug" label="Slug" defaultValue={p?.slug} hint="Leave empty to generate from the title." />
        </Row>
        <Area name="summary" label="Summary" defaultValue={p?.summary} rows={2} />
        <Row>
          <Text name="year" label="Year" type="number" defaultValue={p?.year ?? new Date().getFullYear()} required />
          <Text name="stack" label="Stack" defaultValue={p?.stack} placeholder="Next.js · Postgres" />
          <Text name="sort" label="Order" type="number" defaultValue={p?.sort ?? 0} hint="Lower shows first." />
        </Row>
        <Row>
          <Text name="liveUrl" label="Live URL" type="url" defaultValue={p?.liveUrl} />
          <Text name="repoUrl" label="Repository URL" type="url" defaultValue={p?.repoUrl} />
        </Row>
        <Row>
          <ImageField label="Cover image (4:5 works best)" current={p?.coverUrl} />
          <Color name="tint" label="Background tint" defaultValue={p?.tint ?? "#F1F0EB"} />
        </Row>
        <Text
          name="previewUrl"
          label="Hover preview URL (optional)"
          defaultValue={p?.previewUrl}
          hint="A short MP4/WebM or GIF that plays when someone hovers the card."
        />
        <MarkdownField name="body" label="Case study" defaultValue={p?.body} />
        <Check name="published" label="Published" defaultChecked={p?.published ?? true} />
      </AdminForm>
    </>
  );
}
