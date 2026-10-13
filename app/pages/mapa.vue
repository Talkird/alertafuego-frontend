<script lang="ts" setup>
import { useDocumentVisibility, useIntervalFn } from "@vueuse/core";
import type { BaseLayer, WeatherLayer } from "~/utils/mapLayers";

useSeoMeta({
  title: "Mapa",
  description:
    "Mapa en tiempo casi real de focos de incendio detectados en Argentina mediante imágenes satelitales GOES-19.",
});

const { range, query: rangeQuery } = storeToRefs(useFiltersStore());
const toast = useToast();
const minConfidence = ref(0);
const maxReports = ref(20);
const baseLayer = ref<BaseLayer>("map");
// A constant, not an inline array: vue-leaflet re-centers the map whenever the
// center prop changes identity, i.e. on every re-render (e.g. a filter change).
const INITIAL_CENTER: [number, number] = [-38.4161, -63.6167];
const weatherLayer = ref<WeatherLayer | null>(null);

// The API's maximum. The default (500) silently dropped detections on longer
// ranges.
const query = computed(() => ({ ...rangeQuery.value, limit: 5000 }));

const { data: detections, status, error, refresh } = useDetections(query);
useFetchErrorToast(error, "No se pudieron cargar los focos");

const lastUpdated = ref<Date | null>(null);
watch(
  status,
  (value) => {
    if (value === "success") lastUpdated.value = new Date();
  },
  { immediate: true },
);

/** Refetch, and say so when it brought detections the map didn't have. */
async function refreshAndNotify() {
  const known = new Set((detections.value ?? []).map((d) => d.id));
  await refresh();
  const added = (detections.value ?? []).filter((d) => !known.has(d.id)).length;
  if (added) {
    toast.add({
      title: added === 1 ? "1 foco nuevo" : `${added} focos nuevos`,
      description: "El mapa se actualizó con las últimas detecciones.",
      icon: "i-lucide-flame",
      color: "warning",
    });
  }
}

// Near real time: refetch every 5 minutes while the tab is visible, and right
// away when coming back to a tab left open longer than that.
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const { pause, resume } = useIntervalFn(refreshAndNotify, AUTO_REFRESH_MS);
const visibility = useDocumentVisibility();
watch(visibility, (value) => {
  if (value !== "visible") return pause();
  const age = Date.now() - (lastUpdated.value?.getTime() ?? 0);
  if (age > AUTO_REFRESH_MS) refreshAndNotify();
  resume();
});

const updatedLabel = computed(() =>
  lastUpdated.value
    ? `actualizado ${lastUpdated.value.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}`
    : "",
);

const filteredDetections = computed(() =>
  (detections.value ?? []).filter(
    (detection) =>
      detection.probability * 100 >= minConfidence.value &&
      detection.report_count <= maxReports.value,
  ),
);

const countLabel = computed(() => {
  const shown = filteredDetections.value.length;
  const total = detections.value?.length ?? 0;
  const noun = total === 1 ? "foco" : "focos";
  return shown === total ? `${total} ${noun}` : `${shown} de ${total} ${noun}`;
});
</script>

<template>
  <UDashboardPanel id="map" :ui="{ body: 'p-0 sm:p-0 gap-0' }">
    <template #header>
      <UDashboardNavbar title="Mapa">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <MapFilters
            v-model:range="range"
            v-model:min-confidence="minConfidence"
            v-model:max-reports="maxReports"
          />
        </template>

        <template #right>
          <span class="text-muted me-1.5 hidden text-sm tabular-nums sm:inline">
            {{ countLabel }}
            <template v-if="updatedLabel"> · {{ updatedLabel }}</template>
          </span>
          <UTooltip text="Actualizar">
            <UButton
              color="primary"
              variant="subtle"
              icon="i-lucide-refresh-cw"
              aria-label="Actualizar"
              loading-auto
              @click="refreshAndNotify()"
            />
          </UTooltip>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="relative h-full">
        <LMap
          class="h-full w-full"
          :zoom="4"
          :min-zoom="3"
          :center="INITIAL_CENTER"
          :max-bounds="[
            [-90, -180],
            [90, 180],
          ]"
          :max-bounds-viscosity="1.0"
          :use-global-leaflet="false"
        >
          <MapTileLayers :base="baseLayer" :weather="weatherLayer" />

          <MapDetectionMarker
            v-for="detection in filteredDetections"
            :key="detection.id"
            :detection="detection"
          />
        </LMap>

        <p
          v-if="status === 'success' && !filteredDetections.length"
          class="bg-default/90 ring-default text-toned pointer-events-none absolute top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-lg px-3 py-1.5 text-sm shadow-sm ring"
        >
          {{
            detections?.length
              ? "Ningún foco coincide con los filtros."
              : "No hay focos detectados en este período."
          }}
        </p>

        <MapLayerPicker
          v-model:base="baseLayer"
          v-model:weather="weatherLayer"
          class="absolute top-3 right-3 z-[1000]"
        />

        <div
          class="pointer-events-none absolute bottom-6 left-3 z-[1000] flex flex-col items-start gap-2"
        >
          <MapWeatherLegend v-if="weatherLayer" :layer="weatherLayer" />
          <MapLegend />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
