// Copies documentation, blog posts, images, licences and the community sims out of a simulator
// checkout.
//
//   node scripts/sync_docs.mjs --source /absolute/path/to/Qiskit-Fest-Qognition
//
// Everything in src/content/ is generated here, so do not edit those files by hand. Text stays as
// the simulator repo wrote it. Links are changed so that they keep working on this site, typos that
// break rendering are repaired (see repairMaths), and the lists below say which parts are used.
// All of it is read first, so a moved file stops the sync before anything here is touched.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "src/content");
const ASSETS = join(ROOT, "public/docs-assets");
const LICENCES = join(ROOT, "public/licences");
const REPOSITORY = "https://github.com/Muammal/Qiskit-Fest-Qognition";

const flag = process.argv.indexOf("--source");
if (flag < 0 || !process.argv[flag + 1]) {
  console.error("Usage: node scripts/sync_docs.mjs --source /path/to/simulator");
  process.exit(1);
}
const SOURCE = resolve(process.argv[flag + 1]);
const git = (...args) => execFileSync("git", ["-C", SOURCE, ...args], { encoding: "utf8" }).trim();
const commit = git("rev-parse", "HEAD");

// Groups appear in this order on the Documentation page. `sections` picks `## ` blocks from a file,
// and `from` starts at a heading.
const PAGES = [
  { group: "Start here", slug: "overview", title: "Overview", source: "README.md", intro: true, sections: ["Five Evacuation & Survival Scenarios + Custom Scenario Builder", "Results and changes"] },
  { group: "Start here", slug: "quickstart", title: "Quickstart", source: "README.md", sections: ["Install", "Quickstart & Launch Commands"] },
  { group: "Start here", slug: "interface", title: "Interface tour", source: "README.md", sections: ["Visual Interface & Simulation Showcase"] },
  { group: "Start here", slug: "controls", title: "Controls", source: "README.md", sections: ["Fullscreen & Interactive Controls"] },
  { group: "Start here", slug: "sim-files", title: "Sim files and sharing", source: "docs/SIM_FILES.md" },
  { group: "Start here", slug: "reports", title: "End-of-event report", source: "README.md", sections: ["End-of-Event Report"] },
  { group: "How it works", slug: "architecture", title: "Architecture", source: "README.md", sections: ["Architecture & Codebase Layout"] },
  { group: "How it works", slug: "integration", title: "How the tracks fit together", source: "docs/TECH_A_B_C_INTEGRATION.md" },
  { group: "How it works", slug: "quantum-mind", title: "Tech A: quantum mind", source: "docs/TECH_A_QUANTUM_MIND.md" },
  { group: "How it works", slug: "physics", title: "Tech B: physics and priors", source: "docs/TECH_B_PHYSICS_AND_PRIORS.md" },
  { group: "How it works", slug: "engine", title: "Tech C: engine, world and GUI", source: "docs/TECH_C_ENGINE_WORLD_AND_GUI.md" },
  { group: "Scenario models", slug: "volcano-model", title: "Volcano model", source: "docs/VOLCANO_MODEL.md" },
  { group: "Scenario models", slug: "titanic-model", title: "Titanic model", source: "docs/TITANIC_MODEL.md" },
  { group: "Scenario models", slug: "pompeii-sources", title: "Pompeii sources", source: "docs/POMPEII_SOURCES.md" },
  { group: "Scenario models", slug: "waterloo-sources", title: "Waterloo sources", source: "docs/WATERLOO_SOURCES.md" },
  { group: "Reference", slug: "scenario-numbers", title: "Scenario numbers", source: "docs/results/SCENARIO_NUMBERS.md" },
  { group: "Reference", slug: "sensitivity", title: "Sensitivity", source: "docs/results/SENSITIVITY.md" },
  { group: "Reference", slug: "faq", title: "FAQ", source: "docs/FAQ.md", from: "## FAQ" },
  { group: "Reference", slug: "testing", title: "Testing", source: "README.md", sections: ["Testing"] },
  { group: "Reference", slug: "contributing", title: "Contributing and licence", source: "README.md", sections: ["Contributing, Security and Licence"] },
  { group: "Reference", slug: "references", title: "References", source: "README.md", sections: ["Citations & Theoretical References"] },
];

const EARLY_NOTE = "This explainer was written for the first demo, before the later experiments. For the current results, read “What changed, and what came out”.";

// Listed newest first within a day. The date on each post is the day its file last changed.
const POSTS = [
  { slug: "changes-and-results", title: "What changed, and what came out", source: "docs/CHANGES_AND_RESULTS.md", category: "Results" },
  { slug: "human-data", title: "Does the quantum model predict human data?", source: "docs/HUMAN_DATA_RESULTS.md", category: "Results", sentences: 1 },
  { slug: "lead-time", title: "Does hesitation cost lives when warning is short?", source: "docs/results/LEAD_TIME.md", category: "Results" },
  { slug: "unsure-evacuee", title: "Why an unsure evacuee waits", source: "demo-pack/tech-a/01-why-an-unsure-evacuee-waits.md", category: "Explainer", note: EARLY_NOTE },
  { slug: "order-of-warning-signs", title: "Why the order of warning signs matters", source: "demo-pack/tech-a/02-why-order-of-warning-signs-matters.md", category: "Explainer", note: EARLY_NOTE },
  { slug: "stress-and-decoherence", title: "Stress turns a quantum mind classical", source: "demo-pack/tech-a/03-stress-turns-quantum-mind-classical.md", category: "Explainer", note: EARLY_NOTE },
];

// Pictures the site uses outside any page.
const IMAGES = [
  "docs/images/03_island_survival_sim.png",
  "docs/images/04_volcano_evacuation_sim.png",
  "docs/images/06_titanic_evacuation_sim.png",
  "docs/images/07_pompeii_evacuation_sim.png",
  "docs/images/08_waterloo_chlorine_sim.png",
  "docs/images/09_scenario_builder.png",
];

const read = (path) => readFileSync(join(SOURCE, path), "utf8").replace(/\r\n/g, "\n");

function sectionsOf(markdown) {
  const parts = markdown.split(/^(?=## )/m);
  return { head: parts[0], blocks: Object.fromEntries(parts.slice(1).map((part) => [part.split("\n")[0].slice(3).trim(), part])) };
}

function pick(page) {
  const markdown = read(page.source);
  if (page.from) {
    const start = markdown.indexOf(page.from);
    if (start < 0) throw new Error(`${page.source} has no "${page.from}"`);
    return markdown.slice(start).replace(/^## .*\n/, "");
  }
  if (!page.sections) return markdown;
  const { head, blocks } = sectionsOf(markdown);
  const chosen = page.sections.map((name) => {
    if (!blocks[name]) throw new Error(`${page.source} has no section "${name}"`);
    // A one-section page already has a title, so its own heading would only repeat it.
    return (page.sections.length === 1 ? blocks[name].replace(/^## .*\n/, "") : blocks[name]).replace(/\n---\s*$/, "\n");
  });
  const intro = page.intro ? head.split("\n").filter((line) => !line.startsWith("# ") && !line.startsWith("[![")).join("\n").replace(/---\s*$/, "").trim() + "\n\n" : "";
  return intro + chosen.join("\n");
}

const links = new Map([["README.md", "/docs/overview/"]]);
for (const page of PAGES) if (!page.sections) links.set(page.source, `/docs/${page.slug}/`);
for (const post of POSTS) links.set(post.source, `/blog/${post.slug}/`);

const IMAGE = /\.(png|jpe?g|gif|svg)$/i;
const copies = new Set(IMAGES);

function rewriteTarget(target, sourceFile) {
  if (/^(https?:|mailto:|#)/.test(target)) return target;
  const [path, anchor] = target.split("#");
  const resolved = posix.normalize(posix.join(posix.dirname(sourceFile), path)).replace(/\/$/, "");
  if (resolved.startsWith("..")) return target;
  if (links.has(resolved)) return `${links.get(resolved)}${anchor ? `#${anchor}` : ""}`;
  if (IMAGE.test(resolved)) {
    copies.add(resolved);
    return `/docs-assets/${resolved}`;
  }
  return `${REPOSITORY}/blob/${commit}/${resolved}${anchor ? `#${anchor}` : ""}`;
}

// docs/TECH_A_QUANTUM_MIND.md has \text and \tau saved with a real tab in place of "\t".
const repairMaths = (markdown) => markdown.replace(/\t(ext|au)\b/g, "\\t$1");

function rewriteLinks(markdown, sourceFile) {
  // Code fences keep their text. Only markdown links and images outside them change.
  return markdown
    .split(/(^```[\s\S]*?^```$)/m)
    .map((part, index) => (index % 2 ? part : part.replace(/(!?\[(?:[^\]\\]|\\.)*\]\()([^)\s]+)(\))/g, (_all, open, target, close) => open + rewriteTarget(target, sourceFile) + close)))
    .join("");
}

const clean = (page) => rewriteLinks(repairMaths(pick(page).replace(/^# .*\n+/, "")), page.source).trim() + "\n";

/** The first sentence or two of real prose, for cards. */
function excerpt(markdown, sentences) {
  const paragraph = markdown.split(/\n\n+/).find((block) => /^[A-Z0-9*`]/.test(block) && !block.startsWith("|")) ?? "";
  const text = paragraph
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (sentences) return text.split(/(?<=\.)\s/).slice(0, sentences).join(" ");
  if (text.length <= 220) return text;
  const cut = text.slice(0, 220);
  return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}

const pageFiles = PAGES.map((page) => ({ page, body: clean(page) }));
const postFiles = POSTS.map((post) => ({ post, body: clean(post) }));
const gallery = JSON.parse(read("community/index.json"));
const sims = gallery.sims.map((row) => ({ file: row.file, raw: read(`community/sims/${row.file}`) }));
const licences = ["LICENSE", "NOTICE", "community/LICENSE.txt"].map((path) => [path, read(path)]);

rmSync(CONTENT, { recursive: true, force: true });
rmSync(ASSETS, { recursive: true, force: true });
rmSync(LICENCES, { recursive: true, force: true });
mkdirSync(join(CONTENT, "docs"), { recursive: true });
mkdirSync(join(CONTENT, "blog"), { recursive: true });
mkdirSync(LICENCES, { recursive: true });

for (const { page, body } of pageFiles) writeFileSync(join(CONTENT, "docs", `${page.slug}.md`), body);
for (const { post, body } of postFiles) writeFileSync(join(CONTENT, "blog", `${post.slug}.md`), body);
for (const path of copies) {
  const out = join(ASSETS, path);
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(join(SOURCE, path), out);
}
writeFileSync(join(LICENCES, "APACHE-2.0.txt"), licences[0][1]);
writeFileSync(join(LICENCES, "NOTICE.txt"), licences[1][1]);
writeFileSync(join(LICENCES, "CC-BY-4.0.txt"), licences[2][1]);

const pages = PAGES.map(({ group, slug, title, source }) => ({ group, slug, title, source }));
const posts = postFiles
  .map(({ post: { slug, title, source, category, note, sentences }, body }) => ({
    slug,
    title,
    source,
    category,
    date: git("log", "-1", "--format=%ad", "--date=short", "--", source),
    minutes: Math.max(1, Math.round(body.split(/\s+/).length / 200)),
    excerpt: excerpt(body, sentences),
    cover: /!\[[^\]]*\]\((\/docs-assets\/[^)\s]+)\)/.exec(body)?.[1] ?? null,
    note: note ?? null,
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

writeFileSync(join(ROOT, "src/data/docs.json"), JSON.stringify({ sourceRepository: REPOSITORY, sourceCommit: commit, pages, posts }, null, 2) + "\n");
writeFileSync(join(ROOT, "src/data/community-sims.json"), JSON.stringify({ sourceCommit: commit, sims }, null, 2) + "\n");

console.log(`${pages.length} pages, ${posts.length} posts, ${copies.size} images and ${sims.length} sims from ${commit.slice(0, 7)}`);
