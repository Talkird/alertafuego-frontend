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
          :color="detectionColor(detection.probability)"
          :fill-color="detectionColor(detection.probability)"
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
