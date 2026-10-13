<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Range, StoredDetection } from "~/types";

const props = defineProps<{
  detections: StoredDetection[];
  range: Range;
  /** The fetch limit: hitting it means the period has more detections. */
  limit: number;
}>();

const toast = useToast();

function exportAs(kind: "csv" | "geojson") {
  const list = props.detections;
  if (kind === "csv") {
    downloadFile(
      exportFileName(props.range, "csv"),
      detectionsToCsv(list),
      "text/csv;charset=utf-8",
    );
  } else {
    downloadFile(
      exportFileName(props.range, "geojson"),
      detectionsToGeoJson(list),
      "application/geo+json",
    );
  }
  const truncated = list.length >= props.limit;
  toast.add({
    title: `Exportaste ${list.length} ${list.length === 1 ? "foco" : "focos"}`,
    description: truncated
      ? `El período tiene más de ${props.limit}: acortalo para exportarlos todos.`
      : undefined,
    color: truncated ? "warning" : "success",
  });
}

const items = computed<DropdownMenuItem[]>(() => [
  {
    label: "CSV para Excel",
    icon: "i-lucide-file-spreadsheet",
    onSelect: () => exportAs("csv"),
  },
  {
    label: "GeoJSON para QGIS",
    icon: "i-lucide-map",
    onSelect: () => exportAs("geojson"),
  },
]);
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-download"
      :disabled="!detections.length"
    >
      <span class="hidden sm:inline">Exportar</span>
    </UButton>
  </UDropdownMenu>
</template>
