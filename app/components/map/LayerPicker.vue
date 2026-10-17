<script setup lang="ts">
import type { BaseLayer, WeatherLayer } from "~/utils/mapLayers";

const base = defineModel<BaseLayer>("base", { required: true });
const weather = defineModel<WeatherLayer | null>("weather", {
  required: true,
});
// Only offered where the page binds it (the Mapa page).
const recurrence = defineModel<boolean>("recurrence");

// Weather layers need an OpenWeatherMap key (NUXT_PUBLIC_OWM_API_KEY).
const weatherAvailable = !!useRuntimeConfig().public.owmApiKey;

const baseItems = [
  { label: "Mapa", value: "map" },
  { label: "Satélite", value: "satellite" },
];

const weatherItems = [
  { label: "Ninguno", value: "none" },
  ...WEATHER_LAYERS.map((layer) => ({
    label: layer.label,
    value: layer.value,
  })),
];

// URadioGroup needs a value for "none"; the model uses null.
const weatherValue = computed({
  get: () => weather.value ?? "none",
  set: (value: string) =>
    (weather.value = value === "none" ? null : (value as WeatherLayer)),
});
</script>

<template>
  <UPopover :content="{ align: 'end' }">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-layers"
      class="bg-default shadow-sm"
    >
      Capas
    </UButton>

    <template #content>
      <div class="w-56 space-y-4 p-4">
        <URadioGroup v-model="base" legend="Mapa base" :items="baseItems" />
        <URadioGroup
          v-if="weatherAvailable"
          v-model="weatherValue"
          legend="Clima"
          :items="weatherItems"
        />
        <USwitch
          v-if="recurrence !== undefined"
          v-model="recurrence"
          label="Recurrencia"
          description="Dónde se repiten los focos, en todo el historial."
        />
      </div>
    </template>
  </UPopover>
</template>
