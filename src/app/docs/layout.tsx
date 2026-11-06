import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import { DocsNav } from "@/components/docs/DocsNav";
import { docGroups } from "@/lib/docs";

export const metadata: Metadata = {
  title: { default: "Documentation", template: "%s — Qognition documentation" },
  description: "How to install, run and build on the Qognition simulator, and how its quantum mind, physics and engine work.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="q-page docs-layout">
      <DocsNav groups={docGroups.map(({ group, pages }) => ({ group, pages: pages.map(({ slug, title }) => ({ slug, title })) }))} />
      {children}
    </div>
  );
}
