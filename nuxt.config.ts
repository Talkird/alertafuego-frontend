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

  runtimeConfig: {
    public: {
      apiBase: "http://127.0.0.1:8000",
    },
  },

  css: ["~/assets/css/main.css"],
});
