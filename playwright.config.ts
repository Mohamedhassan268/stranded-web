import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const dev = "C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe";
const userDev =
  "C:/Users/HP OMEN/AppData/Local/Microsoft/Edge Dev/Application/msedge.exe";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3107",
    browserName: "chromium",
    channel: existsSync(dev) || existsSync(userDev) ? undefined : "msedge",
    launchOptions: existsSync(dev)
      ? { executablePath: dev }
      : existsSync(userDev)
        ? { executablePath: userDev }
        : {},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  timeout: 45000,
});
