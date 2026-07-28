<script lang="ts" setup>
function circleColor(probability: number): string {
  if (probability >= 0.8) return "#dc2626";
  if (probability >= 0.65) return "#f97316";
  return "#facc15";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR");
}
</script>

<template>
  <div class="h-screen w-full">
    <LMap
      style="height: 100%; width: 100%"
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
      <LCircle
        v-for="detection in mockDetections"
        :key="detection.id"
        :lat-lng="[
          ewkbToLonLat(detection.location).latitude,
          ewkbToLonLat(detection.location).longitude,
        ]"
        :radius="1500"
        :color="circleColor(detection.probability)"
        :fill-color="circleColor(detection.probability)"
        :fill-opacity="0.5"
      >
        <LPopup>
          <div>
            <p>Probabilidad: {{ (detection.probability * 100).toFixed(1) }}%</p>
            <p>Detectado: {{ formatDate(detection.detected_at) }}</p>
          </div>
        </LPopup>
      </LCircle>
    </LMap>
  </div>
</template>

<style>
html.dark .leaflet-tile-pane {
  filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
}
</style>
