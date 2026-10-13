<script setup lang="ts">
import type { WeatherLayer } from "~/utils/mapLayers";

const props = defineProps<{
  layer: WeatherLayer;
}>();

const info = computed(() =>
  WEATHER_LAYERS.find((l) => l.value === props.layer)!,
);

// Stops are uneven (e.g. rain goes 0.1, 1, 10, 140 mm), so space them evenly
// and label each one, rather than drawing a linear scale.
const gradient = computed(
  () =>
    `linear-gradient(to right, ${info.value.stops.map((s) => s.color).join(", ")})`,
);
</script>

<template>
  <div
    class="bg-default/90 ring-default pointer-events-auto w-56 rounded-lg px-3 py-2 text-xs shadow-sm ring backdrop-blur"
  >
    <p class="text-highlighted mb-1.5 font-medium">
      {{ info.label }} ({{ info.unit }})
    </p>
    <div
      class="ring-default h-2 rounded-full ring"
      :style="{ backgroundImage: gradient }"
    />
    <div class="text-toned mt-1 flex justify-between tabular-nums">
      <span v-for="stop in info.stops" :key="stop.value">{{ stop.value }}</span>
    </div>
  </div>
</template>
