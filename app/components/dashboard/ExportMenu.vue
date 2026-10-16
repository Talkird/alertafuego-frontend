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

async function exportAs(kind: "xlsx" | "csv" | "geojson") {
  const list = props.detections;
  if (kind === "xlsx") {
    downloadFile(
      exportFileName(props.range, "xlsx"),
      await detectionsToXlsx(list),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  } else if (kind === "csv") {
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
    label: "Excel (.xlsx)",
    icon: "i-lucide-file-spreadsheet",
    onSelect: () => exportAs("xlsx"),
  },
  {
    label: "CSV",
    icon: "i-lucide-file-text",
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
