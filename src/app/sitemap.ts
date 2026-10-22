import type { MetadataRoute } from "next";
import { getPublishedPosts, getPublishedProjects } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  const [projects, posts] = await Promise.all([getPublishedProjects(), getPublishedPosts()]);
  return [
    { url: site },
    { url: `${site}/books` },
    { url: `${site}/blog` },
    ...projects.map((p) => ({ url: `${site}/work/${p.slug}`, lastModified: p.updatedAt })),
    ...posts.map((p) => ({ url: `${site}/blog/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
