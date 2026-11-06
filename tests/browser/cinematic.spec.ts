import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("contact opens the mind, traps focus, and returns to the island", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/cinematic/");
  const scene = page.locator(".cinematic-page");
  await expect(scene).toHaveAttribute("data-phase", "0.0000");
  await page.getByRole("button", { name: /05.*CONNECT/ }).click();
  await expect(scene).toHaveAttribute("data-phase", "1.0000");
  await page
    .getByRole("button", { name: "Touch the mind: inspect quantum mind" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(scene).toHaveAttribute("data-dome", "1.000");
  await expect(
    page.getByRole("button", { name: "Close quantum mind" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "RETURN TO THE ISLAND" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close quantum mind" }),
  ).toBeFocused();
  for (const topic of ["ORDER", "STRESS", "CHOICE", "QISKIT", "LIMITS"]) {
    await dialog.getByRole("button", { name: topic, exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: topic, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await expect(dialog).toContainText("No human-survival benefit");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Touch the mind: inspect quantum mind" }),
  ).toBeFocused();
  await page.getByRole("button", { name: /06.*EVADE/ }).click();
  await expect(scene).toHaveAttribute("data-tree", "1.520");
  await expect(scene).toHaveAttribute("data-actor-x", "15.300");
  await page.getByRole("button", { name: /07.*SHELTER/ }).click();
  await expect(scene).toHaveAttribute("data-storm", "1.000");
  await expect(scene).toHaveAttribute("data-actor-x", "19.000");
});
test("mobile mind inspection fits the viewport and leaves scrolling usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/cinematic/");
  await page.getByRole("button", { name: /05.*CONNECT/ }).click();
  await page
    .getByRole("button", { name: "Touch the mind: inspect quantum mind" })
    .click();
  await expect(page.getByRole("dialog")).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "QISKIT", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "does not run on quantum hardware",
  );
  await page.getByRole("button", { name: "Close quantum mind" }).click();
  expect(
    await page.evaluate(() => document.documentElement.style.overflow),
  ).not.toBe("hidden");
});
