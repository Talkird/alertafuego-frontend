<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const user = useSupabaseUser();

const items = [
  { label: "Funcionalidades", to: "#funcionalidades" },
  { label: "Cómo funciona", to: "#como-funciona" },
] satisfies NavigationMenuItem[];

const access = computed(() =>
  user.value
    ? { label: "Ir al mapa", to: "/mapa", icon: "i-lucide-map" }
    : { label: "Iniciar sesión", to: "/login", icon: "i-lucide-log-in" },
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
    <UHeader>
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
          AlertaFuego · Proyecto Final de Ingeniería en Informática, UADE · ©
          {{ new Date().getFullYear() }}
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
