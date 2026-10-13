<script setup lang="ts">
import { es } from "@nuxt/ui/locale";

useHead({ htmlAttrs: { lang: "es-AR" } });
</script>

<template>
  <UApp :locale="es">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
