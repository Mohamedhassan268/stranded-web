import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("cinematic homepage, science metadata and 404", async ({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/");await expect(page.locator(".cinematic-canvas canvas")).toBeVisible();
  await expect(page.getByRole("heading",{level:1})).toContainText("NO WAY");
  await expect(page.getByRole("link",{name:"SKIP TO REPLAY"})).toBeInViewport();
  await page.goto("/science/");await expect(page).toHaveTitle(/science.*Stranded/);
  await expect(page.getByText("201 minutes vs 160 recorded")).toBeVisible();
  await page.goto("/unmapped-route/");await expect(page.getByRole("heading",{level:1})).toContainText("Lost in the");
  expect(errors).toEqual([]);
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
  await expect(
    page.getByRole("link", { name: "SKIP TO REPLAY" }),
  ).toBeInViewport();
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
