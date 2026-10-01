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
  },

  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: ["/"],
    },
  },

  runtimeConfig: {
    public: {
      apiBase,
    },
  },

  css: ["~/assets/css/main.css"],
});
