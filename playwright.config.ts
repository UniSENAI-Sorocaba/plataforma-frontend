import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e", fullyParallel: false, workers: 1, retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  webServer: { command: "npm run start", url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 60_000, env: { HOSTNAME: "127.0.0.1", PORT: "3100", ENABLE_SESSION_DEMO: "true", ENABLE_PROTOTYPES: "true", CATALOG_SOURCE: "mock" } },
});
