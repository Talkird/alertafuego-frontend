<script setup lang="ts">
import type { Popup, PopupEvent } from "leaflet";
import { useResizeObserver } from "@vueuse/core";
import type { StoredDetection } from "~/types";

defineProps<{
  detection: StoredDetection;
}>();

const marker = useTemplateRef<{
  leafletObject?: { openPopup: () => void };
}>("marker");
const content = useTemplateRef<HTMLElement>("content");

// The popup's content (which fetches the detection's reports) only mounts while
// the popup is open - mounting it for every marker meant one request per marker
// on page load.
const open = ref(false);
let popup: Popup | null = null;

function onPopupOpen(event: PopupEvent) {
  popup = event.popup;
  open.value = true;
}

function onPopupClose() {
  open.value = false;
}

// Leaflet sizes and places the popup once, when it opens. Re-place it whenever
// the content changes size (first render, reports loaded, report form shown).
useResizeObserver(content, () => popup?.update());

defineExpose({
  openPopup: () => marker.value?.leafletObject?.openPopup(),
});
</script>

<template>
  <LCircleMarker
    ref="marker"
    :lat-lng="[detection.lat, detection.lon]"
    :radius="6"
    :color="detectionColor(detection.probability)"
    :fill-color="detectionColor(detection.probability)"
    :fill-opacity="0.7"
    @popupopen="onPopupOpen"
    @popupclose="onPopupClose"
  >
    <LPopup :options="{ className: 'af-popup', closeButton: false }">
      <div ref="content">
        <MapDetectionPopup v-if="open" :detection="detection" />
      </div>
    </LPopup>
  </LCircleMarker>
</template>
