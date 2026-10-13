<script setup lang="ts">
// Same thresholds as detectionColor().
const levels = [
  { label: "80% o más", probability: 0.8 },
  { label: "65 a 80%", probability: 0.65 },
  { label: "Menos de 65%", probability: 0 },
];
</script>

<template>
  <div
    class="bg-default/90 ring-default pointer-events-auto rounded-lg px-3 py-2 text-xs shadow-sm ring backdrop-blur"
  >
    <p class="text-highlighted mb-1.5 font-medium">Probabilidad de fuego</p>
    <ul class="space-y-1">
      <li
        v-for="level in levels"
        :key="level.label"
        class="text-toned flex items-center gap-2"
      >
        <span
          class="ring-default size-2.5 rounded-full ring"
          :style="{ backgroundColor: detectionColor(level.probability) }"
        />
        {{ level.label }}
      </li>
    </ul>
  </div>
</template>
