import "server-only";

/** One square of the contribution graph. `level` is GitHub's own 0–4 shade. */
export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
export type Contributions = { login: string; total: number; days: ContributionDay[] };

const TTL = 60 * 60 * 1000;
const TIMEOUT = 5000;

/** "https://github.com/rickmff/" → "rickmff". */
export function githubLogin(url: string) {
  const m = url.match(/github\.com\/([A-Za-z0-9-]+)/i);
  return m ? m[1] : null;
}

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 } as const;

/** With GITHUB_TOKEN set: the GraphQL API (also counts private contributions if the profile shows them). */
async function fromApi(login: string, token: string): Promise<Contributions> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
        totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`,
      variables: { login },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
  const json = await res.json();
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error(`GitHub GraphQL: ${JSON.stringify(json?.errors ?? "no calendar")}`);
  const days: ContributionDay[] = cal.weeks.flatMap(
    (w: { contributionDays: { date: string; contributionCount: number; contributionLevel: keyof typeof LEVELS }[] }) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 })),
  );
  return { login, total: cal.totalContributions, days };
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/**
 * Without a token: the same fragment github.com renders on the profile page. Each day is a
 * `<td data-date data-level id>`; its count lives in the `<tool-tip for="<id>">` next to it.
 */
async function fromProfile(login: string): Promise<Contributions> {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(login)}/contributions`, {
    headers: { Accept: "text/html", "User-Agent": "portfolio-contributions" },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`GitHub contributions ${res.status}`);
  return parseProfile(login, await res.text());
}

export function parseProfile(login: string, html: string): Contributions {
  const tips = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = m[2].trim().match(/^([\d,]+)\s+contribution/);
    tips.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
  }
  const days: ContributionDay[] = [];
  for (const m of html.matchAll(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/g)) {
    const date = attr(m[0], "data-date")!;
    const level = Math.min(4, Math.max(0, Number(attr(m[0], "data-level")) || 0)) as ContributionDay["level"];
    const id = attr(m[0], "id");
    days.push({ date, level, count: (id ? tips.get(id) : undefined) ?? (level ? 1 : 0) });
  }
  if (!days.length) throw new Error("GitHub contributions: no days in the page");
  days.sort((a, b) => a.date.localeCompare(b.date));
  const total = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  return {
    login,
    total: total ? Number(total[1].replace(/,/g, "")) : days.reduce((s, d) => s + d.count, 0),
    days,
  };
}

const cache = new Map<string, { at: number; data?: Contributions; pending?: Promise<Contributions | null> }>();

/**
 * The last year of contributions, refreshed at most once an hour per process. A stale copy is
 * served straight away while a fresh one loads in the background; when GitHub is down the last
 * good copy stays, and with none the widget simply isn't shown.
 */
export async function getContributions(login: string): Promise<Contributions | null> {
  const hit = cache.get(login);
  if (hit && (hit.pending || Date.now() - hit.at < TTL)) return hit.data ?? hit.pending ?? null;
  const token = process.env.GITHUB_TOKEN;
  const pending = (token ? fromApi(login, token) : fromProfile(login))
    .then((data) => {
      cache.set(login, { at: Date.now(), data });
      return data;
    })
    .catch((err) => {
      console.error("[github] contributions:", err instanceof Error ? err.message : err);
      // Keep whatever we had, and try again in five minutes rather than on every request.
      cache.set(login, { at: Date.now() - TTL + 5 * 60 * 1000, data: hit?.data });
      return hit?.data ?? null;
    });
  cache.set(login, { at: hit?.at ?? 0, data: hit?.data, pending });
  return hit?.data ?? pending;
}
