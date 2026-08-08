<script lang="ts" setup>
useSeoMeta({
  title: "Mapa",
  description:
    "Mapa en tiempo casi real de focos de incendio detectados en Argentina mediante imágenes satelitales GOES-19.",
});

const { data: detections } = useDetections();

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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&amp;copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          layer-type="base"
          name="OpenStreetMap"
          no-wrap
        />
        <LCircleMarker
          v-for="detection in detections"
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
