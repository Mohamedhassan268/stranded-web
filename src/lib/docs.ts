// Turns the Markdown in src/content/ into pages. Those files are generated from the simulator
// repository by scripts/sync_docs.mjs and rendered when the site is built.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import katex from "katex";
import { Marked, type Tokens } from "marked";
import docs from "@/data/docs.json";

export const docPages = docs.pages;
export const posts = docs.posts;
export const docsSource = docs;
export const docGroups = [...new Set(docPages.map((page) => page.group))].map((group) => ({ group, pages: docPages.filter((page) => page.group === group) }));

export type Heading = { id: string; text: string };

export const formatDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const plain = (text: string) =>
  text
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"');
const slug = (text: string) =>
  plain(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
const math = (tex: string, displayMode: boolean) => katex.renderToString(tex, { displayMode, throwOnError: false, strict: false, output: "html" });

export function renderContent(folder: "docs" | "blog", pageSlug: string): { html: string; headings: Heading[] } {
  const markdown = readFileSync(join(process.cwd(), "src/content", folder, `${pageSlug}.md`), "utf8");
  const headings: Heading[] = [];
  const seen = new Map<string, number>();
  const marked = new Marked({
    gfm: true,
    extensions: [
      {
        name: "mathBlock",
        level: "block",
        start: (source) => source.match(/^\$\$/m)?.index,
        tokenizer(source) {
          const match = /^\$\$([\s\S]+?)\$\$\s*(?:\n|$)/.exec(source);
          return match ? { type: "mathBlock", raw: match[0], tex: match[1].trim() } : undefined;
        },
        renderer: (token) => `<div class="math">${math(token.tex as string, true)}</div>\n`,
      },
      {
        name: "mathInline",
        level: "inline",
        start: (source) => {
          const at = source.indexOf("$");
          return at < 0 ? undefined : at;
        },
        tokenizer(source) {
          // A $ only opens maths when text touches it on the inside, so "$env:X" and prices stay as they are.
          const match = /^\$(?!\s)((?:\\.|[^$\\\n])+?)(?<!\s)\$(?!\d)/.exec(source);
          return match ? { type: "mathInline", raw: match[0], tex: match[1] } : undefined;
        },
        renderer: (token) => math(token.tex as string, false),
      },
    ],
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const html = this.parser.parseInline(tokens);
        let id = slug(html);
        const count = seen.get(id) ?? 0;
        seen.set(id, count + 1);
        if (count) id = `${id}-${count}`;
        if (depth === 2) headings.push({ id, text: plain(html) });
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      code({ text, lang }: Tokens.Code) {
        if (lang === "mermaid") return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
        return `<pre tabindex="0"><code>${escapeHtml(text)}</code></pre>\n`;
      },
      table(table: Tokens.Table) {
        const cell = (item: Tokens.TableCell, tag: string) => `<${tag}${item.align ? ` style="text-align:${item.align}"` : ""}>${this.parser.parseInline(item.tokens)}</${tag}>`;
        const head = `<tr>${table.header.map((item) => cell(item, "th")).join("")}</tr>`;
        const body = table.rows.map((row) => `<tr>${row.map((item) => cell(item, "td")).join("")}</tr>`).join("");
        return `<div class="table-wrap" tabindex="0"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>\n`;
      },
      link({ href, title, tokens }: Tokens.Link) {
        const external = /^https?:/.test(href) ? ' target="_blank" rel="noreferrer"' : "";
        return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ""}${external}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, title, text }: Tokens.Image) {
        return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy">`;
      },
    },
  });
  return { html: marked.parse(markdown, { async: false }), headings };
}
