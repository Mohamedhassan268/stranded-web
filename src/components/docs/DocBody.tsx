"use client";
import { useEffect, useRef } from "react";

/** Shows a rendered page, and draws its diagrams only if it has any: Mermaid is a large download. */
export function DocBody({ html }: { html: string }) {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const blocks = body.current?.querySelectorAll<HTMLElement>("pre.mermaid");
    if (!blocks?.length) return;
    let gone = false;
    import("mermaid").then(async ({ default: mermaid }) => {
      if (gone) return;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: {
          background: "#fff8e6",
          primaryColor: "#ead8b2",
          primaryBorderColor: "#6a401c",
          primaryTextColor: "#36200e",
          lineColor: "#6a401c",
          secondaryColor: "#faefd4",
          tertiaryColor: "#faefd4",
          fontFamily: "Segoe UI, Inter Variable, sans-serif",
        },
      });
      // If a diagram can't be drawn, its source text stays on the page.
      await mermaid.run({ nodes: [...blocks], suppressErrors: true });
    });
    return () => {
      gone = true;
    };
  }, []);
  return <div ref={body} className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
