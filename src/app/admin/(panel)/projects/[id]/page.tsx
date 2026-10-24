import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProject, saveProject } from "@/app/admin/actions";
import { AdminForm, DeleteButton } from "@/components/admin/AdminForm";
import { Area, Check, Color, ImageField, Row, Text, TranslationFields } from "@/components/admin/Fields";
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
        <Row>
          <Text
            name="previewUrl"
            label="Hover preview URL (optional)"
            defaultValue={p?.previewUrl}
            hint="A short MP4/WebM or GIF that plays when someone hovers the card."
          />
          <label className="adm-field">
            <span>…or upload a clip</span>
            <input type="file" name="preview" accept="video/mp4,video/webm,image/gif,image/webp" />
            <small>4:5, muted, up to 40 MB. Replaces the URL.</small>
          </label>
        </Row>
        <Row>
          <div className="adm-field">
            <span>Showcase film (16:9)</span>
            {p?.showcaseUrl ? (
              <>
                <small>Current: {p.showcaseUrl}</small>
                <label className="adm-check">
                  <input type="checkbox" name="removeShowcase" />
                  <span>Remove showcase</span>
                </label>
              </>
            ) : null}
            <input type="file" name="showcase" accept="video/mp4,video/webm" />
            <small>From scripts/showcase-project.mjs, up to 40 MB. Plays on the card instead of the desktop/mobile clips.</small>
          </div>
          <label className="adm-field">
            <span>Showcase poster</span>
            <input type="file" name="showcasePoster" accept="image/jpeg,image/png,image/webp,image/avif" />
            <small>The film&apos;s first frame (showcase.webp).</small>
          </label>
          <label className="adm-field">
            <span>Phone part starts at (seconds)</span>
            <input type="number" name="showcaseMobileAt" step="0.01" min="0" defaultValue={p?.showcaseMobileAt ?? ""} />
            <small>mobileAt from the script. Shows the Desktop · Mobile buttons on the card.</small>
          </label>
        </Row>
        <Row>
          <div className="adm-field">
            <span>Mobile cover (phone screen, 390×844)</span>
            {p?.coverMobileUrl ? (
              <div className="adm-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.coverMobileUrl} alt="" />
                <label className="adm-check">
                  <input type="checkbox" name="removeMobile" />
                  <span>Remove mobile view</span>
                </label>
              </div>
            ) : null}
            <input type="file" name="coverMobile" accept="image/jpeg,image/png,image/webp,image/avif" />
          </div>
          <label className="adm-field">
            <span>Mobile clip</span>
            {p?.previewMobileUrl ? <small>Current: {p.previewMobileUrl}</small> : null}
            <input type="file" name="previewMobile" accept="video/mp4,video/webm" />
            <small>Shown in a phone frame when the card is switched to mobile.</small>
          </label>
        </Row>
        <MarkdownField name="body" label="Case study" defaultValue={p?.body} />
        <TranslationFields
          value={p?.translations}
          fields={[
            { name: "title", label: "Title" },
            { name: "summary", label: "Summary", rows: 2 },
            { name: "body", label: "Case study", markdown: true },
          ]}
        />
        <Check name="published" label="Published" defaultChecked={p?.published ?? true} />
      </AdminForm>
    </>
  );
}
