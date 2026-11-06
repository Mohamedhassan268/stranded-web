import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dev = "C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe";
const userDev =
  "C:/Users/HP OMEN/AppData/Local/Microsoft/Edge Dev/Application/msedge.exe";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3108",
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
  // Tests post sims and reviews, so they get a server with its own throwaway data file.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npx next build && npx next start --hostname 127.0.0.1 --port 3108",
        url: "http://127.0.0.1:3108",
        reuseExistingServer: false,
        timeout: 240000,
        env: {
          REPO_DATA_FILE: join(tmpdir(), `qognition-test-${Date.now()}.json`),
          MODERATION_TOKEN: "test-token",
          NEXT_DIST_DIR: ".next-test",
        },
      },
});
