<script setup lang="ts">
const data = computed(() =>
  mockDetections.map((detection) => {
    const { latitude, longitude } = ewkbToLonLat(detection.location);
    return {
      id: detection.id,
      latitude: latitude.toFixed(5),
      longitude: longitude.toFixed(5),
      probability: `${(detection.probability * 100).toFixed(1)}%`,
      image_time: new Date(detection.image_time).toLocaleString("es-AR"),
      detected_at: new Date(detection.detected_at).toLocaleString("es-AR"),
      threshold: detection.threshold,
    };
  }),
);
</script>

<template>
  <UTable :data="data" class="flex-1 p-12" />
</template>
