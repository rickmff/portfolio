/**
 * Schema.org structured data. Nodes are emitted as one `@graph` so they can reference each
 * other by `@id` (a post's author is the site's Person, not a copy of it).
 */
export function JsonLd({ graph }: { graph: object[] }) {
  // `<` is escaped so a title containing "</script>" can't close the tag.
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
