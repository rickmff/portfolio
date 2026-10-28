import { Arrow } from "@/components/Arrow";
import { ContributionGraph } from "@/components/ContributionGraph";
import { getContributions, githubLogin } from "@/lib/github";
import type { Dict } from "@/lib/i18n/dict";

/** The home page's GitHub section. Streams in on its own, and isn't shown at all without data. */
export async function GitHubActivity({ url, t }: { url: string; t: Dict }) {
  const login = githubLogin(url);
  const data = login ? await getContributions(login) : null;
  if (!data) return null;
  return (
    <section id="github" className="wrap section" style={{ maxWidth: 860 }} data-sr-delay="120">
      {/* Streamed in after the page, so ScrollReveal may tag it before React hydrates it. */}
      <div className="section-head center" suppressHydrationWarning>
        <h2>{t.home.github}</h2>
      </div>
      <ContributionGraph days={data.days} total={data.total} />
      <p className="section-more">
        <a href={url} target="_blank" rel="noopener noreferrer" className="link-muted with-arrow">
          {t.home.githubProfile(data.login)} <Arrow dir="out" />
        </a>
      </p>
    </section>
  );
}
