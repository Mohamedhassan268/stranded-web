import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash, randomUUID } from "node:crypto";
import community from "../../src/data/community-sims.json";
import docs from "../../src/data/docs.json";

const moderator = { Authorization: "Bearer test-token" };

/** A valid .qsim with a new id, so each run posts something the repo hasn't seen. */
function newSim(title = "Test eruption") {
  const id = `test_${randomUUID().slice(0, 8)}`;
  const base = JSON.parse(community.sims[0].raw);
  const scenario = base.scenario.replace("made_up_island_eruption", id).replace("Eruption on a made-up island", title);
  const sha256 = createHash("sha256").update(scenario).digest("hex");
  return { id, text: JSON.stringify({ ...base, title, scenario, sha256 }) };
}

/** A different address each time, so tests don't use up each other's rate limits. */
const address = () => ({ "x-forwarded-for": `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1` });

const upload = (page: Page, name: string, text: string) =>
  page.getByLabel("Choose a .qsim file").setInputFiles({ name, mimeType: "application/octet-stream", buffer: Buffer.from(text) });

test("the gallery lists, searches and filters sims", async ({ page }) => {
  await page.goto("/repo/");
  await expect(page.getByRole("heading", { name: "Public Repo", level: 1 })).toBeVisible();
  await expect(page.getByText("Anyone can publish, and nobody has validated these.")).toBeVisible();
  const storm = page.getByRole("heading", { name: "Storm on a made-up island" });
  await expect(storm).toBeVisible();
  await page.getByRole("searchbox", { name: "Search" }).fill("cyclone");
  await expect(storm).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quantum against control" })).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Search" }).fill("nothing has this in it");
  await expect(page.getByText("Nothing matches that")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search" }).fill("");
  await page.getByRole("combobox", { name: "Hazard" }).selectOption("storm");
  await expect(storm).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quantum against control" })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("posting a sim, reviewing it, downloading it and removing it", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const sim = newSim();
  await page.goto("/repo/");
  await page.getByRole("button", { name: "Post a sim" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Post a sim");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await upload(page, "notes.txt", "hello");
  await expect(dialog.getByRole("alert")).toContainText("Only .qsim files");
  await upload(page, "broken.qsim", "not a sim");
  await expect(dialog.getByRole("alert")).toContainText("isn't a sim file");

  await upload(page, `${sim.id}.qsim`, sim.text);
  await expect(dialog).toContainText("Test eruption");
  await expect(dialog).toContainText("OK Safe place");
  await expect(dialog).toContainText("In this scenario (7)");
  await dialog.getByRole("button", { name: "Post to the Public Repo" }).click();

  await expect(page).toHaveURL(new RegExp(`/repo/${sim.id}/$`));
  await expect(page.getByRole("heading", { name: "Test eruption", level: 1 })).toBeVisible();
  await expect(page.locator(".q-badge", { hasText: "Community" })).toBeVisible();
  await expect(page.locator(".command-row code")).toContainText(`/api/sims/${sim.id}/file/`);

  await page.getByLabel("Your review").fill("<b>Ran</b> on seed 1. Everyone reached the coast.");
  await page.getByRole("button", { name: "Post review" }).click();
  await expect(page.locator(".review-form [role=alert]")).toContainText("one to five stars");
  await page.getByLabel("4 stars").check({ force: true });
  await page.getByLabel("Your name (optional)").fill("Sam");
  await page.getByRole("button", { name: "Post review" }).click();
  const posted = page.locator(".review-list li");
  await expect(posted).toContainText("Sam");
  await expect(posted).toContainText("<b>Ran</b> on seed 1", { useInnerText: true });
  await expect(posted.locator("b b")).toHaveCount(0);
  await expect(page.getByText("4.0 from 1 review")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const file = await request.get(`/api/sims/${sim.id}/file/`);
  expect(file.headers()["content-disposition"]).toBe(`attachment; filename="${sim.id}.qsim"`);
  expect(await file.text()).toBe(sim.text);

  await page.goto("/repo/");
  await expect(page.getByRole("link", { name: "View sim: Test eruption" }).first()).toBeVisible();

  expect((await request.delete(`/api/sims/${sim.id}/`)).status()).toBe(401);
  expect((await request.delete(`/api/sims/${sim.id}/`, { headers: moderator })).status()).toBe(204);
  expect((await request.get(`/repo/${sim.id}/`)).status()).toBe(404);
  expect(errors).toEqual([]);
});

test("the server applies the rules itself", async ({ request }) => {
  const post = (body: object, headers = address()) => request.post("/api/sims/", { data: body, headers });
  const sim = newSim();
  expect((await post({ file: "not a sim" })).status()).toBe(400);
  expect((await post({})).status()).toBe(400);
  expect((await post({ file: sim.text, website: "spam" })).status()).toBe(400);
  expect((await post({ file: community.sims[0].raw })).status()).toBe(409);
  expect((await post({ file: sim.text })).status()).toBe(201);
  const again = await post({ file: sim.text });
  expect(again.status()).toBe(409);

  const review = (data: object) => request.post(`/api/sims/${sim.id}/reviews/`, { data, headers: address() });
  expect((await review({ rating: 6, text: "Too many stars" })).status()).toBe(400);
  expect((await review({ rating: 3, text: "x" })).status()).toBe(400);
  expect((await review({ rating: 3, text: "bad‮text" })).status()).toBe(400);
  expect((await review({ rating: 3, text: "Fine", website: "spam" })).status()).toBe(400);
  expect((await request.post("/api/sims/missing/reviews/", { data: { rating: 3, text: "Fine" }, headers: address() })).status()).toBe(404);

  const headers = address();
  const statuses = [];
  for (let i = 0; i < 4; i++) statuses.push((await request.post(`/api/sims/${sim.id}/reviews/`, { data: { rating: 5, text: `Run ${i}` }, headers })).status());
  expect(statuses).toEqual([201, 201, 201, 429]);

  const uploader = address();
  const uploads = [];
  for (let i = 0; i < 6; i++) uploads.push((await post({ file: newSim().text }, uploader)).status());
  expect(uploads).toEqual([201, 201, 201, 201, 201, 429]);

  const listed = await (await request.get("/api/sims/")).json();
  for (const row of listed.sims.filter((item: { official: boolean }) => !item.official)) {
    await request.delete(`/api/sims/${row.id}/`, { headers: moderator });
  }
});

test("documentation pages render, with their maths and diagrams", async ({ page, request }) => {
  for (const { slug } of docs.pages) {
    const response = await request.get(`/docs/${slug}/`);
    expect(response.status(), slug).toBe(200);
    expect(await response.text(), `${slug} has broken maths`).not.toContain("katex-error");
  }
  await page.goto("/docs/");
  await expect(page.getByRole("heading", { name: "Documentation", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Start the quickstart" }).click();
  await expect(page.getByRole("heading", { name: "Quickstart", level: 1 })).toBeVisible();
  await expect(page.getByText("pip install -r requirements.txt")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("searchbox", { name: "Filter pages" }).fill("titanic");
  await expect(page.getByRole("link", { name: "Titanic model" })).toBeVisible();
  await expect(page.locator(".docs-link")).toHaveCount(1);

  await page.goto("/docs/quantum-mind/");
  await expect(page.locator("pre.mermaid svg")).toBeVisible({ timeout: 20000 });
  expect(await page.locator(".katex").count()).toBeGreaterThan(20);
  await expect(page.locator(".docs-toc li")).toHaveCount(5);
  await page.goto("/docs/interface/");
  const image = page.getByRole("img", { name: "Scenario Selection Hub" });
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
});

test("the blog lists real posts and each one reads as an article", async ({ page, request }) => {
  await page.goto("/blog/");
  await expect(page.getByRole("heading", { name: "What we found, and how it works" })).toBeVisible();
  await expect(page.getByRole("heading", { name: docs.posts[0].title })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  for (const { slug } of docs.posts) {
    const response = await request.get(`/blog/${slug}/`);
    expect(response.status(), slug).toBe(200);
    expect(await response.text(), `${slug} has broken maths`).not.toContain("katex-error");
  }
  await page.getByRole("link", { name: /Why the order of warning signs matters/ }).click();
  await expect(page.getByRole("heading", { name: "Why the order of warning signs matters", level: 1 })).toBeVisible();
  await expect(page.getByText("written for the first demo")).toBeVisible();
  await expect(page.locator(".article-foot")).toContainText("demo-pack/tech-a/");
  await expect.poll(() => page.locator(".prose img").first().evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  for (const file of ["APACHE-2.0.txt", "NOTICE.txt", "CC-BY-4.0.txt"]) {
    expect((await request.get(`/licences/${file}`)).status(), file).toBe(200);
  }
});

test("the team page shows the people, their photos and their credits", async ({ page, request }) => {
  await page.goto("/team/");
  await expect(page.locator(".team-card")).toHaveCount(4);
  for (const name of ["Muammal A. Fadhil", "Bernard Kim", "Mohammed Hassan", "Brodin Vance"]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
  const photos = page.locator(".team-portrait img");
  await expect(photos).toHaveCount(3);
  for (const src of await photos.evaluateAll((images) => images.map((image) => image.getAttribute("src")!))) {
    expect((await request.get(src)).status(), src).toBe(200);
  }
  await expect(page.locator(".team-card").filter({ hasText: "Brodin Vance" }).locator(".team-portrait")).toHaveText("BV");
  await expect(page.locator(".team-credits")).toContainText("Mohammed Hassan and Bernard Kim");
  await expect(page.locator(".team-credits")).toContainText("Muammal A. Fadhil and Brodin Vance");
  await expect(page.locator(".team-card").getByText(/tech [a-d]|product d|quantum mind|engine/i)).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("the paper page gives the abstract, findings, limits and the PDF", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Paper" }).click();
  await expect(page).toHaveURL(/\/paper\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Quantum Cognition");
  await expect(page.getByText("Muammal A. Fadhil, Mohammed Hassan, Bernard Kim and Brodin Vance")).toBeVisible();
  await expect(page.locator(".paper-findings li")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: "What it doesn't show" })).toBeVisible();
  const pdf = await request.get("/media/qognition-paper.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  await expect(page.getByRole("link", { name: "Conclusion" })).toHaveAttribute("href", "/media/qognition-paper.pdf#page=11");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("new pages fit a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/blog/", `/blog/${docs.posts[0].slug}/`, "/repo/", "/repo/made_up_island_eruption/", "/docs/", "/docs/quantum-mind/", "/paper/", "/team/", "/science/", "/privacy/"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true);
  }
});
