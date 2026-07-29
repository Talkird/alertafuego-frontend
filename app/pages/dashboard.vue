<script setup lang="ts">
import { sub } from "date-fns";
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/vue-table";
import { getPaginationRowModel } from "@tanstack/table-core";
import type { Detection } from "~/utils/mockDetections";
import type { Period, Range } from "~/types";

useSeoMeta({
  title: "Dashboard",
  description:
    "Estadísticas históricas de focos de incendio detectados en Argentina, filtrables por fecha y período.",
});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date(),
});
const period = ref<Period>("daily");

const filteredDetections = computed(() =>
  mockDetections.filter((detection) => {
    const imageTime = new Date(detection.image_time);
    return imageTime >= range.value.start && imageTime <= range.value.end;
  }),
);

function confidenceColor(
  probability: number,
): "error" | "warning" | "neutral" {
  if (probability >= 0.8) return "error";
  if (probability >= 0.65) return "warning";
  return "neutral";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR");
}

function getRowItems(row: Row<Detection>) {
  const { latitude, longitude } = ewkbToLonLat(row.original.location);

  return [
    {
      label: "Ver en Google Maps",
      icon: "i-lucide-map-pin",
      onSelect() {
        window.open(
          `https://www.google.com/maps?q=${latitude},${longitude}`,
          "_blank",
        );
      },
    },
  ];
}

const columns: TableColumn<Detection>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    id: "location",
    header: "Ubicación",
    cell: ({ row }) => {
      const { latitude, longitude } = ewkbToLonLat(row.original.location);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    },
  },
  {
    accessorKey: "probability",
    header: "Probabilidad",
    cell: ({ row }) =>
      h(
        UBadge,
        {
          variant: "subtle",
          color: confidenceColor(row.original.probability),
        },
        () => `${(row.original.probability * 100).toFixed(1)}%`,
      ),
  },
  {
    accessorKey: "detected_at",
    header: "Detectado",
    cell: ({ row }) => formatDate(row.original.detected_at),
  },
  {
    accessorKey: "image_time",
    header: "Imagen",
    cell: ({ row }) => formatDate(row.original.image_time),
  },
  {
    id: "actions",
    meta: {
      class: {
        td: "text-right",
      },
    },
    cell: ({ row }) =>
      h(
        UDropdownMenu,
        {
          content: { align: "end" },
          items: getRowItems(row),
          "aria-label": "Acciones",
        },
        () =>
          h(UButton, {
            icon: "i-lucide-ellipsis-vertical",
            color: "neutral",
            variant: "ghost",
            "aria-label": "Acciones",
          }),
      ),
  },
];

const table = useTemplateRef("table");

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <DashboardDateRangePicker v-model="range" class="-ms-1" />
          <DashboardPeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <DashboardDetectionsChart
        :detections="filteredDetections"
        :period="period"
        :range="range"
      />

      <UTable
        ref="table"
        :data="filteredDetections"
        :columns="columns"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0',
        }"
      />

      <div class="flex justify-end">
        <UPagination
          :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
