<script setup lang="ts">
import type { NuxtError } from "#app";
import { es } from "@nuxt/ui/locale";

const props = defineProps<{ error: NuxtError }>();

// Nuxt's own status messages are in English and technical.
const message = computed(() =>
  props.error.status === 404
    ? "La página que buscás no existe o cambió de dirección."
    : "Algo falló al cargar esta página. Probá de nuevo en unos minutos.",
);

useSeoMeta({
  title: props.error.status === 404 ? "Página no encontrada" : "Error",
});
</script>

<template>
  <UApp :locale="es">
    <UError
      :error="{
        status: error.status,
        statusText:
          error.status === 404 ? 'Página no encontrada' : 'Error inesperado',
        message,
      }"
      :clear="{ label: 'Volver al inicio', icon: 'i-lucide-house' }"
      class="min-h-screen"
    />
  </UApp>
</template>
