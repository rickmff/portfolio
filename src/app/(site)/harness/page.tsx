import type { Metadata } from "next";
import { getHarness } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Harness",
  description: "The tools, services and setup I build with.",
};

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export default async function HarnessPage() {
  const items = await getHarness();
  // Categories keep the order of their first item, so the backoffice order decides both.
  const groups = new Map<string, typeof items>();
  for (const item of items) groups.set(item.category, [...(groups.get(item.category) ?? []), item]);

  return (
    <>
      <section className="wrap page-title reveal">
        <p className="eyebrow" style={{ margin: 0 }}>Harness</p>
        <h1>The tools and setup I build with.</h1>
      </section>
      <section className="wrap section harness" style={{ maxWidth: 720 }}>
        {items.length === 0 ? <p className="muted" style={{ textAlign: "center" }}>Coming soon.</p> : null}
        {[...groups].map(([category, list]) => (
          <div key={category} className="harness-group">
            {category ? <h2 className="eyebrow">{category}</h2> : null}
            <ul>
              {list.map((i) => (
                <li key={i.id}>
                  <a href={i.url} target="_blank" rel="noopener noreferrer" className="harness-item">
                    <span className="harness-name">
                      {i.name} <span aria-hidden="true">↗</span>
                    </span>
                    {i.description ? <span className="harness-desc">{i.description}</span> : null}
                    <span className="harness-host mono">{host(i.url)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
