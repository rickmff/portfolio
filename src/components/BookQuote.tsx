/**
 * A book's best-known line, set large with a highlighter stroke that sweeps in under the text.
 * Works on the server and inside the client shelf alike.
 */
export function BookQuote({
  quote,
  source,
  className,
  children,
}: {
  quote: string;
  source?: string | null;
  className?: string;
  /** Extra caption content after the source, e.g. the book's title on /quotes. */
  children?: React.ReactNode;
}) {
  return (
    <figure className={`bq${className ? ` ${className}` : ""}`}>
      <blockquote>
        <p>
          <mark className="bq-mark">{`“${quote.replace(/^["“]|["”]$/g, "")}”`}</mark>
        </p>
      </blockquote>
      {source || children ? (
        <figcaption className="bq-cap">
          {children}
          {source ? <span className="bq-source">{source}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
