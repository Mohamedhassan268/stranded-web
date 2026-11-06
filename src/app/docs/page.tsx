import Link from "next/link";
import { docGroups, docsSource } from "@/lib/docs";

export default function DocsHome() {
  return (
    <div className="docs-index">
      <header className="q-card docs-main">
        <h1>Documentation</h1>
        <p className="docs-source">
          Everything here comes from the{" "}
          <a href={`${docsSource.sourceRepository}/tree/${docsSource.sourceCommit}`} target="_blank" rel="noreferrer">
            simulator repository
          </a>{" "}
          at commit <code>{docsSource.sourceCommit.slice(0, 7)}</code>. All results are model output, not predictions.
        </p>
        <div className="button-row" style={{ justifyContent: "flex-start" }}>
          <Link className="q-btn q-btn--vivid q-btn--green" href="/docs/quickstart/">
            Start the quickstart
          </Link>
          <Link className="q-btn" href="/docs/overview/">
            <span>Read the overview</span>
          </Link>
        </div>
      </header>
      {docGroups.map(({ group, pages }) => (
        <section className="q-card" key={group}>
          <h2 className="q-heading">{group}</h2>
          <ul className="docs-index-group">
            {pages.map((page) => (
              <li key={page.slug}>
                <Link href={`/docs/${page.slug}/`}>{page.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
