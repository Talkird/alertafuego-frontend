<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Mapa",
    to: "/",
  },
  {
    label: "Logs",
    to: "/logs",
  },
]);
</script>

<template>
  <UHeader mode="drawer">
    <template #title>
      <div class="flex items-center gap-2">
        <img src="/icon.png" alt="AlertaFuego" class="h-8 w-8" />
        <p>AlertaFuego</p>
      </div>
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
