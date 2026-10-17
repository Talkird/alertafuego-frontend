<script setup lang="ts">
import type { Recurrence } from "~/types";

// All stored history, whatever the map's period: recurrence is about years.
const config = useRuntimeConfig();
const { data, error } = useFetch<Recurrence>("/stats/recurrence", {
  baseURL: config.public.apiBase,
  key: "stats:recurrence",
  server: false,
});
useFetchErrorToast(error, "No se pudo cargar la recurrencia");

// Least recurrent first, so the hottest cells are drawn on top.
const cells = computed(() =>
  [...(data.value?.cells ?? [])].sort((a, b) => a.fire_days - b.fire_days),
);

const formatDate = (iso: string) =>
  parseUtc(iso).toLocaleDateString("es-AR", { dateStyle: "medium" });
</script>

<template>
  <LCircleMarker
    v-for="cell in cells"
    :key="`${cell.lat},${cell.lon}`"
    :lat-lng="[cell.lat, cell.lon]"
    :radius="recurrenceLevel(cell.fire_days).radius"
    :stroke="false"
    :fill-color="recurrenceLevel(cell.fire_days).color"
    :fill-opacity="0.6"
  >
    <LTooltip>
      <p class="font-medium">
        Fuego {{ cell.fire_days }}
        {{ cell.fire_days === 1 ? "día" : "días distintos" }}
        <template v-if="cell.years > 1"> en {{ cell.years }} años</template>
      </p>
      <p>
        {{ cell.detection_count }}
        {{ cell.detection_count === 1 ? "detección" : "detecciones" }} · última
        {{ formatDate(cell.last_image_time) }}
      </p>
    </LTooltip>
  </LCircleMarker>
</template>
