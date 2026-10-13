export default defineAppConfig({
  ui: {
    colors: {
      primary: "emerald",
      neutral: "mist",
    },
    // The defaults (up to 160px above and below each section) left the landing
    // page mostly empty space between sections.
    pageHero: {
      slots: { container: "py-20 sm:py-24 lg:py-28" },
    },
    pageSection: {
      slots: { container: "py-14 sm:py-20 lg:py-24" },
    },
  },
});
