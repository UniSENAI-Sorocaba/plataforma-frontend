import { defineConfig } from "@playwright/test";
const server = (port: string, env: Record<string, string>) => ({
  command: "npm run start", url: `http://127.0.0.1:${port}`, reuseExistingServer: false, timeout: 60_000,
  env: { HOSTNAME: "127.0.0.1", PORT: port, ...env },
});
export default defineConfig({
  testDir: "tests/e2e", fullyParallel: false, workers: 1, retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3101", trace: "retain-on-failure" },
  webServer: [
    { command: "node tests/fixtures/catalog-api.mjs", url: "http://127.0.0.1:4101/health", reuseExistingServer: false },
    server("3101", { ENABLE_SESSION_DEMO: "true", ENABLE_PROTOTYPES: "true", CATALOG_SOURCE: "mock" }),
    server("3102", { ENABLE_SESSION_DEMO: "false", ENABLE_PROTOTYPES: "false", CATALOG_SOURCE: "mock" }),
    server("3103", { ENABLE_SESSION_DEMO: "false", ENABLE_PROTOTYPES: "false", CATALOG_SOURCE: "api", CATALOG_API_URL: "http://127.0.0.1:4101/projects" }),
  ],
});
