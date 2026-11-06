import type { Metadata } from "next";
import { Icon } from "@/components/Icons";
import { paper } from "@/data/paper";
import { sourceUrl } from "@/data/site";

export const metadata: Metadata = {
  title: "Paper",
  description: "The Qognition research paper: a two-qubit quantum-probability model of belief in an evacuation simulator, tested against matched controls.",
};

export default function Paper() {
  return (
    <div className="q-page">
      <header className="page-heading">
        <p className="q-kicker">{paper.venue}</p>
        <h1>{paper.title}</h1>
        <p>{paper.authors}</p>
      </header>
      <div className="paper-actions">
        <a className="q-btn q-btn--gold" href={paper.pdf} target="_blank" rel="noreferrer">
          <Icon name="external" width="16" height="16" />
          <span>Open the PDF</span>
        </a>
        <a className="q-btn" href={paper.pdf} download>
          <Icon name="download" width="16" height="16" />
          <span>Download</span>
        </a>
      </div>
      <div className="paper-layout">
        <div className="paper-main">
          <section className="q-card" aria-labelledby="abstract">
            <h2 id="abstract">Abstract</h2>
            <p>{paper.abstract}</p>
          </section>
          <section className="q-card" aria-labelledby="findings">
            <h2 id="findings">Main findings</h2>
            <ol className="paper-findings">
              {paper.findings.map((finding) => (
                <li key={finding.id}>
                  <h3>
                    <span>{finding.id}</span> {finding.title}
                  </h3>
                  <p>{finding.detail}</p>
                </li>
              ))}
            </ol>
          </section>
          <section className="q-card" aria-labelledby="limits">
            <h2 id="limits">What it doesn&apos;t show</h2>
            <p>These results describe a modelling mechanism. They don&apos;t establish that people behave this way, or that there&apos;s a quantum computational advantage.</p>
            <ul className="paper-limits">
              {paper.limits.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="paper-side">
          <nav className="q-card" aria-labelledby="contents">
            <h2 id="contents">Contents</h2>
            <ol className="paper-contents">
              {paper.contents.map((section) => (
                <li key={section.title}>
                  <a href={`${paper.pdf}#page=${section.page}`} target="_blank" rel="noreferrer">
                    {section.title}
                  </a>
                  <span>
                    <span className="visually-hidden">page </span>
                    {section.page}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
          <section className="q-card" aria-labelledby="code">
            <h2 id="code">Code and data</h2>
            <p>The simulator and archived results are public.</p>
            <a className="q-btn q-btn--small" href={sourceUrl}>
              <Icon name="external" width="14" height="14" />
              <span>Source code</span>
            </a>
          </section>
        </aside>
      </div>
      <section className="q-card paper-reader" aria-labelledby="reader">
        <h2 id="reader">Read it here</h2>
        <object data={paper.pdf} type="application/pdf" aria-labelledby="reader">
          <p>
            Your browser can&apos;t show the PDF on this page. <a href={paper.pdf}>Open the PDF</a> instead.
          </p>
        </object>
      </section>
    </div>
  );
}
