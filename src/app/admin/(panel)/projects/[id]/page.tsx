import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteProject, saveProject } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { TitleInput } from "@/components/admin/Controls";
import { Area, Check, Color, FileField, ImageField, Props, Section, Text, TranslationFields } from "@/components/admin/Fields";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { db, schema } from "@/db";

const CLIP = "video/mp4,video/webm";
const STILL = "image/jpeg,image/png,image/webp,image/avif";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [p] = isNew ? [undefined] : await db.select().from(schema.projects).where(eq(schema.projects.id, Number(id)));
  if (!isNew && !p) notFound();
  return (
    <AdminForm
      action={saveProject}
      crumb={{ href: "/admin/projects", label: "Projects" }}
      title={p?.title ?? "New project"}
      viewHref={p ? `/work/${p.slug}` : undefined}
      deleteAction={p ? deleteProject.bind(null, p.id) : undefined}
    >
      {p ? <input type="hidden" name="id" value={p.id} /> : null}
      <TitleInput name="title" defaultValue={p?.title} placeholder="Untitled project" required />
      <Props>
        <Check name="published" label="Published" icon="globe" defaultChecked={p?.published ?? true} />
        <Area name="summary" label="Summary" defaultValue={p?.summary} />
        <Text name="year" label="Year" type="number" icon="calendar" defaultValue={p?.year ?? new Date().getFullYear()} required />
        <Text name="stack" label="Stack" icon="layers" defaultValue={p?.stack} placeholder="Next.js · Postgres" />
        <Text name="liveUrl" label="Live URL" type="url" defaultValue={p?.liveUrl} placeholder="https://" />
        <Text name="repoUrl" label="Repository" type="url" defaultValue={p?.repoUrl} placeholder="https://github.com/…" />
        <Text name="sort" label="Order" type="number" icon="list" defaultValue={p?.sort ?? 0} hint="Lower shows first." />
        <Text name="slug" label="Slug" icon="link" defaultValue={p?.slug} placeholder="From the title" hint="Leave empty to generate from the title." />
      </Props>

      <Section title="Card" icon="image" open={isNew} note="Cover, tint and hover clip">
        <Props>
          <ImageField label="Cover" current={p?.coverUrl} hint="4:5 works best." />
          <Color name="tint" label="Background tint" defaultValue={p?.tint ?? "#F1F0EB"} />
          <Text
            name="previewUrl"
            label="Hover preview URL"
            icon="link"
            defaultValue={p?.previewUrl}
            placeholder="Optional"
            hint="A short MP4/WebM or GIF that plays when someone hovers the card."
          />
          <FileField name="preview" label="…or upload a clip" icon="film" accept="video/mp4,video/webm,image/gif,image/webp" hint="4:5, muted, up to 40 MB. Replaces the URL." />
        </Props>
      </Section>

      <Section title="Showcase" icon="film" open={isNew} note="Film and mobile view on the project page">
        <Props>
          <FileField
            name="showcase"
            label="Showcase film"
            icon="film"
            accept={CLIP}
            current={p?.showcaseUrl}
            removeName="removeShowcase"
            hint="16:9. showcase.mp4 from scripts/showcase-project.mjs (the desktop site, full frame), up to 40 MB."
          />
          <FileField name="showcasePoster" label="Showcase poster" icon="image" accept={STILL} current={p?.showcasePosterUrl} kind="image" hint="The film's first frame (showcase.webp)." />
          <FileField
            name="coverMobile"
            label="Mobile cover"
            icon="image"
            accept={STILL}
            current={p?.coverMobileUrl}
            kind="image"
            removeName="removeMobile"
            removeLabel="Remove mobile view"
            hint="9:16, mobile.webp."
          />
          <FileField name="previewMobile" label="Mobile clip" icon="film" accept={CLIP} current={p?.previewMobileUrl} hint="mobile.mp4, a 9:16 reel. Turns on the card's Desktop · Mobile buttons." />
          <Text
            name="showcaseMobileAt"
            label="Phone part at (s)"
            type="number"
            icon="clock"
            step="0.01"
            min="0"
            defaultValue={p?.showcaseMobileAt ?? ""}
            hint="Only for older films with a phone part and no mobile clip."
          />
        </Props>
      </Section>

      <MarkdownField name="body" label="Case study" defaultValue={p?.body} />
      <TranslationFields
        value={p?.translations}
        fields={[
          { name: "title", label: "Title" },
          { name: "summary", label: "Summary", rows: 2 },
          { name: "body", label: "Case study", markdown: true },
        ]}
      />
    </AdminForm>
  );
}
