<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import type { NavigationMenuItem } from "@nuxt/ui";

const user = useSupabaseUser();

const sections = [
  { label: "Funcionalidades", id: "funcionalidades" },
  { label: "Cómo funciona", id: "como-funciona" },
  { label: "Fuente de datos", id: "fuente-de-datos" },
];

// Smooth scrolling for the in-page links, only on the landing (the app pages
// shouldn't animate route changes) and not for users who ask for less motion.
// Nuxt's router scrolls to #hash targets with the default behavior, which
// follows this CSS.
useHead({ htmlAttrs: { class: "motion-safe:scroll-smooth" } });

// The section currently in view, highlighted in the menu: the last one whose
// top has scrolled past 40% of the viewport (none while on the hero).
const activeSection = ref<string | null>(null);

function updateActiveSection() {
  const atBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2;
  // The last section may be too short to ever reach the line.
  if (atBottom) {
    activeSection.value = sections.at(-1)!.id;
    return;
  }
  const line = window.innerHeight * 0.4;
  let current: string | null = null;
  for (const { id } of sections) {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    if (top !== undefined && top <= line) current = id;
  }
  activeSection.value = current;
}

useEventListener("scroll", updateActiveSection, { passive: true });
onMounted(updateActiveSection);

const items = computed<NavigationMenuItem[]>(() =>
  sections.map(({ label, id }) => ({
    label,
    to: `#${id}`,
    active: activeSection.value === id,
  })),
);

const access = computed(() =>
  user.value
    ? { label: "Ir al mapa", to: "/mapa", icon: "i-lucide-map" }
    : { label: "Iniciar sesión", to: "/login" },
);

const footerLinks = [
  {
    label: "Frontend",
    icon: "i-simple-icons-github",
    to: "https://github.com/Talkird/alertafuego-frontend",
    target: "_blank",
  },
  {
    label: "Backend",
    icon: "i-simple-icons-github",
    to: "https://github.com/Talkird/alertafuego-backend",
    target: "_blank",
  },
];
</script>

<template>
  <div>
    <UHeader mode="drawer">
      <template #title>
        <img src="/icon.png" alt="" class="size-6" />
        <span class="text-highlighted font-semibold">AlertaFuego</span>
      </template>

      <UNavigationMenu :items="items" variant="link" />

      <template #right>
        <UColorModeButton />
        <UButton v-bind="access" class="hidden lg:flex" />
      </template>

      <template #body>
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          class="-mx-2.5"
        />
        <UButton v-bind="access" block class="mt-4" />
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-muted text-sm">
          AlertaFuego © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          v-for="link in footerLinks"
          :key="link.label"
          v-bind="link"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </template>
    </UFooter>
  </div>
</template>
