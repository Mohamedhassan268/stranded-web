import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocBody } from "@/components/docs/DocBody";
import { docPages, docsSource, renderContent } from "@/lib/docs";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => docPages.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: docPages.find((row) => row.slug === slug)?.title ?? "Documentation" };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const index = docPages.findIndex((row) => row.slug === slug);
  if (index < 0) notFound();
  const page = docPages[index];
  const { html, headings } = renderContent("docs", slug);
  const previous = docPages[index - 1];
  const next = docPages[index + 1];
  return (
    <>
      <article className="q-card docs-main">
        <header>
          <span className="q-kicker">{page.group}</span>
          <h1>{page.title}</h1>
          <p className="docs-source">
            From{" "}
            <a href={`${docsSource.sourceRepository}/blob/${docsSource.sourceCommit}/${page.source}`} target="_blank" rel="noreferrer">
              <code>{page.source}</code>
            </a>{" "}
            in the simulator repository
          </p>
        </header>
        <DocBody html={html} />
        <nav className="docs-pager" aria-label="Next and previous pages">
          {previous ? (
            <Link className="q-btn q-btn--sand" href={`/docs/${previous.slug}/`}>
              &lt; {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link className="q-btn q-btn--sand" href={`/docs/${next.slug}/`}>
              {next.title} &gt;
            </Link>
          )}
        </nav>
      </article>
      {headings.length > 0 && (
        <aside className="q-card docs-toc">
          <h2 className="q-heading">On this page ({headings.length})</h2>
          <ol>
            {headings.map((heading) => (
              <li key={heading.id}>
                <a href={`#${heading.id}`}>{heading.text}</a>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </>
  );
}
