<script setup lang="ts">
import { sub } from "date-fns";
import type { TableColumn } from "@nuxt/ui";
import type { Column, Row } from "@tanstack/vue-table";
import { getPaginationRowModel } from "@tanstack/table-core";
import type { StoredDetection, Period, Range } from "~/types";

useSeoMeta({
  title: "Dashboard",
  description:
    "Estadísticas históricas de focos de incendio detectados en Argentina, filtrables por fecha y período.",
});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 30 }),
  end: new Date(),
});
const period = ref<Period>("daily");

const query = computed(() => ({
  since: range.value.start.toISOString(),
  until: range.value.end.toISOString(),
}));

const { data: detections } = useDetections(query);

function confidenceColor(probability: number): "error" | "warning" | "neutral" {
  if (probability >= 0.8) return "error";
  if (probability >= 0.65) return "warning";
  return "neutral";
}

function formatDate(iso: string): string {
  const utcIso = iso.endsWith("Z") ? iso : `${iso}Z`;
  return new Date(utcIso).toLocaleString("es-AR", { hour12: false });
}

function getHeader(column: Column<StoredDetection, unknown>, label: string) {
  const isSorted = column.getIsSorted();

  return h(
    UDropdownMenu,
    {
      content: { align: "start" },
      "aria-label": "Ordenar",
      items: [
        {
          label: "Ascendente",
          icon: "i-lucide-arrow-up-narrow-wide",
          type: "checkbox",
          checked: isSorted === "asc",
          onSelect: () => {
            if (isSorted === "asc") column.clearSorting();
            else column.toggleSorting(false);
          },
        },
        {
          label: "Descendente",
          icon: "i-lucide-arrow-down-wide-narrow",
          type: "checkbox",
          checked: isSorted === "desc",
          onSelect: () => {
            if (isSorted === "desc") column.clearSorting();
            else column.toggleSorting(true);
          },
        },
      ],
    },
    () =>
      h(UButton, {
        color: "neutral",
        variant: "ghost",
        label,
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-arrow-up-narrow-wide"
            : "i-lucide-arrow-down-wide-narrow"
          : "i-lucide-arrow-up-down",
        class: "-mx-2.5 data-[state=open]:bg-elevated",
        "aria-label": `Ordenar por ${isSorted === "asc" ? "descendente" : "ascendente"}`,
      }),
  );
}

function getRowItems(row: Row<StoredDetection>) {
  const { lat, lon } = row.original;

  return [
    {
      label: "Ver en Google Maps",
      icon: "i-lucide-map-pin",
      onSelect() {
        window.open(`https://www.google.com/maps?q=${lat},${lon}`, "_blank");
      },
    },
  ];
}

const columns: TableColumn<StoredDetection>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => getHeader(column, "ID"),
  },
  {
    id: "location",
    header: "Ubicación",
    cell: ({ row }) =>
      `${row.original.lat.toFixed(4)}, ${row.original.lon.toFixed(4)}`,
  },
  {
    accessorKey: "probability",
    header: ({ column }) => getHeader(column, "Probabilidad"),
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
    accessorKey: "report_count",
    header: ({ column }) => getHeader(column, "Reportes"),
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

const sorting = ref([]);
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
        :detections="detections ?? []"
        :period="period"
        :range="range"
      />

      <UTable
        ref="table"
        v-model:sorting="sorting"
        v-model:pagination="pagination"
        :data="detections ?? []"
        :columns="columns"
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
          :default-page="
            (table?.tableApi?.getState().pagination.pageIndex || 0) + 1
          "
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
