<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Column, Row } from "@tanstack/vue-table";
import { getPaginationRowModel } from "@tanstack/table-core";
import type { StoredDetection, Period } from "~/types";

useSeoMeta({
  title: "Estadísticas",
  description:
    "Estadísticas históricas de focos de incendio detectados en Argentina, filtrables por fecha y período.",
});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const { range, query } = storeToRefs(useFiltersStore());
const period = ref<Period>("daily");

// The total and the daily chart count these rows, so ask for the API's maximum
// rather than the default 500.
const { data: detections, error: detectionsError } = useDetections(
  computed(() => ({ ...query.value, limit: 5000 })),
);
const { data: hours, error: hoursError } = useHourlyStats(query);
useFetchErrorToast(
  computed(() => detectionsError.value ?? hoursError.value),
  "No se pudieron cargar las estadísticas",
);

const route = useRoute();

// The region and report cards fetch their own data, so refresh by key: the
// keys set in useDetections and useStats.
function refresh() {
  return refreshNuxtData([
    `detections:${route.path}`,
    "stats:hourly",
    "stats:regions",
    "stats:reports",
  ]);
}

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
      icon: "i-lucide-external-link",
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
      h(
        "span",
        { class: "font-mono text-xs" },
        `${row.original.lat.toFixed(4)}, ${row.original.lon.toFixed(4)}`,
      ),
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
    accessorKey: "image_time",
    header: "Imagen satelital",
    cell: ({ row }) => formatDate(row.original.image_time),
  },
  {
    accessorKey: "detected_at",
    header: "Procesada",
    cell: ({ row }) => formatDate(row.original.detected_at),
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
      <UDashboardNavbar title="Estadísticas">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <DashboardDateRangePicker v-model="range" class="-ms-1" />
          <DashboardPeriodSelect v-model="period" :range="range" />
        </template>

        <template #right>
          <UTooltip text="Actualizar">
            <UButton
              color="primary"
              variant="subtle"
              icon="i-lucide-refresh-cw"
              aria-label="Actualizar"
              loading-auto
              @click="refresh()"
            />
          </UTooltip>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <DashboardDetectionsChart
        :detections="detections ?? []"
        :period="period"
        :range="range"
      />

      <DashboardHourlyChart :hours="hours ?? []" />

      <div class="grid shrink-0 gap-4 lg:grid-cols-2">
        <DashboardRegionStats />
        <DashboardReportStats />
      </div>

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
