"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteName, sourceUrl } from "@/data/site";

const links = [
  { href: "/blog/", label: "Blog" },
  { href: "/demo/", label: "Replay" },
  { href: "/repo/", label: "Public Repo" },
  { href: "/docs/", label: "Documentation" },
  { href: "/paper/", label: "Paper" },
  { href: "/science/", label: "Science" },
  { href: "/team/", label: "Team" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label={`${siteName} home`}>
          {siteName.toUpperCase()}
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} aria-current={path.startsWith(link.href) ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <Link href="/" className="brand">
            {siteName.toUpperCase()}
          </Link>
          <p>
            A research model from Qiskit Fall Fest 2026. Its results are not predictions, and it must not be used to plan or make decisions in a real emergency.
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          <ul>
            <li>
              <Link href="/blog/">Blog</Link>
            </li>
            <li>
              <Link href="/demo/">Replay</Link>
            </li>
            <li>
              <Link href="/repo/">Public Repo</Link>
            </li>
            <li>
              <Link href="/cinematic/">The story</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2>Project</h2>
          <ul>
            <li>
              <Link href="/docs/">Documentation</Link>
            </li>
            <li>
              <Link href="/paper/">Paper</Link>
            </li>
            <li>
              <a href={sourceUrl}>Source code</a>
            </li>
            <li>
              <Link href="/team/">Team</Link>
            </li>
            <li>
              <Link href="/privacy/">Privacy</Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="footer-legal">
        © 2026 The Qognition Authors. Documentation is used under the <a href="/licences/APACHE-2.0.txt">Apache License 2.0</a> (<a href="/licences/NOTICE.txt">notice</a>).
        Community sims are shared under <a href="/licences/CC-BY-4.0.txt">CC BY 4.0</a>.
      </p>
    </footer>
  );
}
