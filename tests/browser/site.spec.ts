import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("home page, navigation, story, science metadata and 404", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Qognition/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("think like calculators");
  await expect(page.getByRole("heading", { name: "Latest from the blog" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What the results say" })).toBeVisible();
  await page.getByRole("link", { name: /Island wilderness/ }).click();
  await expect(page.getByRole("img", { name: /Recorded island map/ })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "Public Repo" }).click();
  await expect(page).toHaveURL(/\/repo\/$/);
  await expect(nav.getByRole("link", { name: "Public Repo" })).toHaveAttribute("aria-current", "page");
  await page.goto("/cinematic/");
  await expect(page.locator(".cinematic-canvas canvas")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("NO WAY");
  await expect(page.getByRole("link", { name: "REPLAY" })).toBeInViewport();
  await page.goto("/science/");
  await expect(page).toHaveTitle(/science.*Qognition/);
  await expect(page.getByText("201 minutes vs 160 recorded")).toBeVisible();
  await page.goto("/unmapped-route/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Lost in the",
  );
  expect(errors).toEqual([]);
});
test("the home page erupts on opening, and again on request", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const hero = page.locator(".erupt-hero");
  await expect(hero).toHaveAttribute("data-phase", "tremor");
  await expect(page.locator(".erupt-bubble").first()).toHaveText("Tremor?");
  await expect(hero).toHaveAttribute("data-phase", "eruption", { timeout: 8000 });
  await expect(hero).toHaveAttribute("data-eruptions", "1");
  await page.getByRole("button", { name: "Erupt again" }).click();
  await expect(hero).toHaveAttribute("data-eruptions", "2");
  expect(
    await page.locator(".erupt-canvas").evaluate((node: HTMLCanvasElement) => {
      const { data } = node.getContext("2d")!.getImageData(0, 0, node.width, node.height);
      return new Set(Array.from({ length: 2000 }, (_, i) => data[i * 40 * 4])).size;
    }),
  ).toBeGreaterThan(10);
  expect((await new AxeBuilder({ page }).include(".erupt-card").analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});
test("the card never covers the island, at any width", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 785, 1000, 1099, 1100, 1280, 1600]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.locator(".erupt-hero")).toHaveAttribute("data-eruptions", "1");
    const layout = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const canvas = document.querySelector<HTMLCanvasElement>(".erupt-canvas")!;
      const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
      // The rock at the volcano's foot is the only grey on land, so count it across the canvas.
      let rock = 0;
      for (let at = 0; at < data.length; at += 4) if (Math.abs(data[at] - data[at + 1]) < 24 && data[at] > 70 && data[at] < 175 && data[at + 2] < data[at] && data[at + 1] > data[at + 2]) rock += 1;
      return { rock: rock / (canvas.width * canvas.height), cardBottom: box(".erupt-card").bottom, stageBottom: box(".erupt-stage").bottom, cardTop: box(".erupt-card").top };
    });
    expect(layout.rock, `volcano size at ${width}px`).toBeGreaterThan(0.03);
    if (width < 1100) expect(layout.cardTop, `card stacks at ${width}px`).toBeGreaterThanOrEqual(layout.stageBottom);
  }
});
test("the ad plays from the home page, with a poster and captions", async ({ page, request }) => {
  await page.goto("/");
  const video = page.locator("#ad video");
  await expect(video).toHaveAttribute("poster", "/media/qognition-ad-poster.jpg");
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => Math.round(node.duration))).toBe(30);
  for (const file of ["qognition-ad.mp4", "qognition-ad-poster.jpg", "qognition-ad.vtt"]) {
    expect((await request.get(`/media/${file}`)).status(), file).toBe(200);
  }
  await page.getByRole("link", { name: "Watch the ad" }).click();
  await expect(video).toBeInViewport();
  await video.evaluate(async (node: HTMLVideoElement) => {
    node.muted = true;
    await node.play();
  });
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime)).toBeGreaterThan(0.2);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("reduced motion shows the eruption as a still picture", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const hero = page.locator(".erupt-hero");
  await expect(hero).toHaveAttribute("data-eruptions", "1");
  await expect(page.getByRole("button", { name: "Erupt again" })).toHaveCount(0);
  await expect(page.getByRole("img", { name: /Pixel art of an island/ })).toBeVisible();
});
test("playback, keyboard slider, speed, reset and paired selection", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/demo/");
  await expect(
    page.getByRole("button", { name: "Next step", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByTestId("step-count")).toHaveText("2 / 36");
  const slider = page.getByRole("slider", { name: "Replay position" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("step-count")).toHaveText("3 / 36");
  await page
    .getByRole("combobox", { name: "Playback speed" })
    .selectOption("4");
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect
    .poll(async () =>
      Number(
        (await page.getByTestId("step-count").innerText()).split(" / ")[0],
      ),
    )
    .toBeGreaterThan(3);
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  await page.getByRole("button", { name: "Reset replay", exact: true }).click();
  await expect(page.getByTestId("step-count")).toHaveText("1 / 36");
  await page.getByRole("checkbox", { name: "Compare models" }).check();
  await expect(page.locator(".replay-panel")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Next step", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("combobox", { name: "Recorded case" })
    .selectOption("island-42-quantum");
  await expect(page.getByTestId("step-count")).toHaveText("1 / 36");
  await expect(page.locator("canvas").first()).toHaveAttribute(
    "aria-label",
    /island/,
  );
  await page.getByText("Recording provenance & downloads").click();
  await expect(
    page.getByRole("link", { name: "Quantum cognition JSON" }),
  ).toHaveAttribute("href", "/runs/island-42-quantum.json");
  await page.screenshot({
    path: "test-results/replay-comparison.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("mobile, reduced motion, text equivalents and accessibility", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Five scenarios" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/cinematic/");
  await expect(page.getByRole("link", { name: "REPLAY" })).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/demo/");
  await expect(
    page.getByRole("button", { name: "Next step", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("img", { name: /Recorded volcano map/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/replay-mobile.png",
    fullPage: true,
  });
});
test("run summary and evacuation zones", async ({ page }) => {
  await page.goto("/demo/?case=volcano-91-quantum");
  await expect(page.getByRole("combobox", { name: "Recorded case" })).toHaveValue("volcano-91-quantum");
  const summary = page.locator(".run-summary");
  await expect(summary).toContainText("Quantum mind: survived the full 72 hours");
  await expect(summary).toContainText("Mixture control on this seed");
  await expect(summary).toContainText("First pyroclastic flow");
  await page.getByRole("checkbox", { name: "Show evacuation zones" }).check();
  await page.getByText("Jump to a decision").click();
  await page.getByRole("button", { name: /Decision 05/ }).click();
  await expect(page.getByTestId("step-count")).toHaveText("5 / 36");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("unavailable or corrupt assets pause playback and allow recovery", async ({
  page,
}) => {
  await page.route("**/runs/volcano-42-quantum.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"world":{}}',
    }),
  );
  await page.goto("/demo/");
  await expect(page.locator(".replay-error[role=alert]")).toContainText(
    "failed validation",
  );
  await expect(
    page.getByRole("button", { name: "Play replay", exact: true }),
  ).toBeDisabled();
  await page.unroute("**/runs/volcano-42-quantum.json");
  await page.getByRole("button", { name: "Retry recording" }).click();
  await expect(
    page.getByRole("button", { name: "Next step", exact: true }),
  ).toBeEnabled();
  await page.route("**/runs/island-42-quantum.json", (route) =>
    route.fulfill({ status: 404, body: "Not found" }),
  );
  await page
    .getByRole("combobox", { name: "Recorded case" })
    .selectOption("island-42-quantum");
  await expect(page.locator(".replay-error[role=alert]")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play replay", exact: true }),
  ).toBeDisabled();
});
