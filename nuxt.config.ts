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
      apiBase: "https://rdy7dfklzkxo7u2nrk3va5wb2y0eebcz.lambda-url.us-east-1.on.aws",
    },
  },

  css: ["~/assets/css/main.css"],
});
