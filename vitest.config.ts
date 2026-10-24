import { defineVitestConfig } from "@nuxt/test-utils/config";

// Unit and component tests run inside a Nuxt environment (auto-imports,
// runtime config, Nuxt UI). The backend and Supabase are never reached: tests
// stub $fetch or mock the composables they use.
export default defineVitestConfig({
  test: {
    include: ["test/unit/**/*.test.ts"],
    environment: "nuxt",
    environmentOptions: {
      nuxt: {
        domEnvironment: "happy-dom",
        overrides: {
          runtimeConfig: { public: { apiBase: "http://api.test" } },
        },
      },
    },
    env: {
      SUPABASE_URL: "http://supabase.test",
      SUPABASE_KEY: "test-anon-key",
    },
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,vue}"],
      reporter: ["text", "json-summary"],
    },
  },
});
