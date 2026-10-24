import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the statically generated site, served like
// production (test/e2e/static-server.mjs). The backend and
// Supabase are never reached: their URLs point to unreachable hosts and every
// request to them is answered by the tests (test/e2e/fixtures.ts), with the
// shapes of the backend's OpenAPI contract.
const PORT = 3100;
const env = {
  NUXT_PUBLIC_API_BASE: "http://api.test",
  NUXT_PUBLIC_SUPABASE_URL: "http://supabase.test",
  NUXT_PUBLIC_SUPABASE_KEY: "test-anon-key",
};

export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: "junit-e2e.xml" }]]
    : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /responsive\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /responsive\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npx nuxt generate && node test/e2e/static-server.mjs",
    url: `http://localhost:${PORT}`,
    env: { ...env, PORT: String(PORT) },
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
