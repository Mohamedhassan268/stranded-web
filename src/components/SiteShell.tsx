import Link from "next/link";
import { Icon } from "./Icons";
import { sourceUrl } from "@/data/site";
export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Stranded home">
        <span>
          STRANDED<span className="brand-dot">_</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/science/">The science</Link>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="source-nav"
        >
          Project source <Icon name="external" width="13" height="13" />
        </a>
        <Link className="nav-demo" href="/demo/">
          Open replay <Icon />
        </Link>
      </nav>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link href="/" className="brand">
          STRANDED<span className="brand-dot">_</span>
        </Link>
        <p>
          One human. Changing circumstances.
          <br />A different way to model a decision.
        </p>
      </div>
      <div className="footer-links">
        <Link href="/demo/">Watch a replay</Link>
        <Link href="/science/">Methods & evidence</Link>
        <a href={sourceUrl}>
          Research project & contributors <Icon name="external" width="13" />
        </a>
        <Link href="/privacy/">Privacy</Link>
      </div>
      <div className="footer-bottom">
        <span>Qiskit Fall Fest 2026 · Research prototype</span>
        <span>Recorded simulations. No claim of quantum advantage.</span>
      </div>
    </footer>
  );
}
