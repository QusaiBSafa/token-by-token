import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const chromium = "/opt/pw-browsers/chromium";
const PORT = 3100;
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
    launchOptions: existsSync(chromium) && process.env.PW_USE_SYSTEM_CHROMIUM !== "0" ? { executablePath: chromium, args: ["--no-sandbox"] } : {},
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: false } },
  ],
  webServer: { command: `pnpm start -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
