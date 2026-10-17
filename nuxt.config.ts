const apiBase =
  process.env.NUXT_PUBLIC_API_BASE ??
  "https://rdy7dfklzkxo7u2nrk3va5wb2y0eebcz.lambda-url.us-east-1.on.aws";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/ui",
    "@nuxt/image",
    "@pinia/nuxt",
    "@nuxtjs/leaflet",
    "@nuxtjs/seo",
    "@nuxt/eslint",
    "@nuxtjs/supabase",
  ],

  site: {
    name: "AlertaFuego",
    // The canonical URL for the sitemap, robots and social/SEO tags.
    url: "https://alertafuego.com.ar",
  },

  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: ["/", "/confirmar-email"],
    },
  },

  runtimeConfig: {
    public: {
      apiBase,
      // Optional: enables the weather layers on the maps. Set with
      // NUXT_PUBLIC_OWM_API_KEY (free key from openweathermap.org).
      owmApiKey: "",
    },
  },

  css: ["~/assets/css/main.css"],

  // Pages behind login render in the browser only. The site is deployed with
  // `nuxt generate`, and pre-rendering these pages ran the auth redirect with
  // no session at build time, baking a redirect to /login into their HTML -
  // so reloading any of them logged the user out. Client-rendered, the
  // redirect check runs in the browser, where the session cookie is.
  routeRules: {
    "/mapa": { ssr: false },
    "/estadisticas": { ssr: false },
    // Old name of the statistics page.
    "/dashboard": { redirect: "/estadisticas" },
    "/alertas": { ssr: false },
    "/cuenta": { ssr: false },
  },
});
