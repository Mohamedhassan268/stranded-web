"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Group = { group: string; pages: { slug: string; title: string }[] };

export function DocsNav({ groups }: { groups: Group[] }) {
  const path = usePathname();
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const shown = groups.map(({ group, pages }) => ({ group, pages: pages.filter((page) => page.title.toLowerCase().includes(search)) })).filter(({ pages }) => pages.length);
  return (
    <nav className="q-card docs-side" aria-label="Documentation pages">
      <h2 className="q-heading">Contents</h2>
      <input className="q-input docs-filter" type="search" aria-label="Filter pages" placeholder="Filter pages" value={query} onChange={(event) => setQuery(event.target.value)} />
      {shown.map(({ group, pages }) => (
        <div className="docs-group" key={group}>
          <h3>{group}</h3>
          <ul>
            {pages.map((page) => (
              <li key={page.slug}>
                <Link className="docs-link" href={`/docs/${page.slug}/`} aria-current={path === `/docs/${page.slug}/` ? "page" : undefined}>
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {!shown.length && (
        <p className="q-notice" style={{ marginTop: 12 }}>
          No page has that in its name.
        </p>
      )}
    </nav>
  );
}
