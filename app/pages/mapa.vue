<script lang="ts" setup>
import { sub } from "date-fns";
import type { Range } from "~/types";

useSeoMeta({
  title: "Mapa",
  description:
    "Mapa en tiempo casi real de focos de incendio detectados en Argentina mediante imágenes satelitales GOES-19.",
});

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 30 }),
  end: new Date(),
});
const minConfidence = ref(0);
const maxReports = ref(20);

const query = computed(() => ({
  since: range.value.start.toISOString(),
  until: range.value.end.toISOString(),
}));

const { data: detections, refresh } = useDetections(query);

const filteredDetections = computed(() =>
  (detections.value ?? []).filter(
    (detection) =>
      detection.probability * 100 >= minConfidence.value &&
      detection.report_count <= maxReports.value,
  ),
);

function circleColor(probability: number): string {
  if (probability >= 0.8) return "#dc2626";
  if (probability >= 0.65) return "#f97316";
  return "#facc15";
}
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
          <UButton
            color="primary"
            variant="subtle"
            icon="i-lucide-refresh-cw"
            loading-auto
            @click="refresh()"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <LMap
        class="h-full w-full"
        :zoom="4"
        :min-zoom="3"
        :center="[-38.4161, -63.6167]"
        :max-bounds="[
          [-90, -180],
          [90, 180],
        ]"
        :max-bounds-viscosity="1.0"
        :use-global-leaflet="false"
      >
        <LTileLayer
          url="https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{-y}.png"
          attribution='&amp;copy; <a href="https://www.ign.gob.ar/">Instituto Geográfico Nacional</a>'
          layer-type="base"
          name="Argenmap (IGN)"
          no-wrap
        />

        <LCircleMarker
          v-for="detection in filteredDetections"
          :key="detection.id"
          :lat-lng="[detection.lat, detection.lon]"
          :radius="6"
          :color="circleColor(detection.probability)"
          :fill-color="circleColor(detection.probability)"
          :fill-opacity="0.7"
        >
          <LPopup :options="{ className: 'af-popup', closeButton: false }">
            <MapDetectionPopup :detection="detection" />
          </LPopup>
        </LCircleMarker>
      </LMap>
    </template>
  </UDashboardPanel>
</template>

<style>
/* @unovis/ts (used by DetectionsChart on the dashboard) bundles its own
 * stale copy of leaflet.css, which it injects into <head> the moment its
 * JS is loaded — regardless of whether any unovis map component is ever
 * rendered. That copy sets `.leaflet-overlay-pane { z-index: 1 }`, versus
 * our real Leaflet's `z-index: 400`. Same specificity, so whichever rule
 * loads later wins, permanently dropping the marker pane below the tile
 * pane for the rest of the SPA session once the dashboard has been
 * visited. Tiles have `pointer-events: none` in Leaflet's own CSS, so
 * markers stay clickable through the now-higher tiles while being
 * completely hidden behind them. Upstream bug, unfixed as of writing:
 * https://github.com/f5/unovis/issues/554
 */
.leaflet-overlay-pane {
  z-index: 400 !important;
}

html.dark .leaflet-tile-pane {
  filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
}

.af-popup .leaflet-popup-content-wrapper {
  background: var(--ui-bg);
  color: var(--ui-text);
  border-radius: calc(var(--ui-radius) * 2);
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  border: 1px solid var(--ui-border);
}

.af-popup .leaflet-popup-content {
  margin: 0.75rem 1rem;
}

.af-popup .leaflet-popup-tip {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  box-shadow: none;
}
</style>
