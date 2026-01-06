import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import "dotenv/config";

// ✅ Load .env
dotenv.config();

// ✅ Fallback values if not set
const S2_BASE_URL =
  process.env.S2_BASE_URL ?? "https://s2.cengagelearning.com.au";
const PROD_BASE_URL = process.env.PROD_BASE_URL ?? "https://www.cengage.com.au";

export default defineConfig({
  testDir: "./tests",
  retries: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"], // console
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "reports/junit.xml" }], // for Jenkins JUnit plugin
  ],
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    browserName: 'chromium',
    channel: undefined, // VERY IMPORTANT
  },
  projects: [
    {
      name: "S2",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: S2_BASE_URL,
      },
    },
    {
      name: "PROD",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: PROD_BASE_URL,
      },
    },
  ],
});
