<script setup lang="ts">
import type { Range } from "~/types";

const range = defineModel<Range>("range", { required: true });
/** Minutes back from now, or 0 to use `range`. */
const recentMinutes = defineModel<number>("recentMinutes", { required: true });
const minConfidence = defineModel<number>("minConfidence", { required: true });
const maxReports = defineModel<number>("maxReports", { required: true });

const MAX_REPORTS_BOUND = 20;

const recentItems = [
  { label: "Por fechas", value: 0 },
  { label: "Últimos 30 min", value: 30 },
  { label: "Última hora", value: 60 },
  { label: "Últimas 3 horas", value: 180 },
  { label: "Últimas 6 horas", value: 360 },
  { label: "Últimas 12 horas", value: 720 },
];

const maxReportsLabel = computed(() =>
  maxReports.value >= MAX_REPORTS_BOUND
    ? "Sin límite"
    : String(maxReports.value),
);

const activeCount = computed(
  () =>
    Number(minConfidence.value > 0) +
    Number(maxReports.value < MAX_REPORTS_BOUND),
);

function reset() {
  minConfidence.value = 0;
  maxReports.value = MAX_REPORTS_BOUND;
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <USelect
      v-model="recentMinutes"
      :items="recentItems"
      :icon="recentMinutes ? 'i-lucide-clock' : undefined"
      variant="ghost"
      class="data-[state=open]:bg-elevated -ms-1"
      aria-label="Período"
    />
    <DashboardDateRangePicker v-if="!recentMinutes" v-model="range" />

    <UPopover :content="{ align: 'start' }">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-sliders-horizontal"
        class="data-[state=open]:bg-elevated"
      >
        Filtros
        <UBadge
          v-if="activeCount"
          :label="String(activeCount)"
          size="sm"
          variant="subtle"
          class="rounded-full tabular-nums"
        />
      </UButton>

      <template #content>
        <div class="w-72 space-y-5 p-4">
          <UFormField :label="`Probabilidad mínima: ${minConfidence}%`">
            <USlider v-model="minConfidence" :min="0" :max="100" :step="5" />
          </UFormField>

          <UFormField
            :label="`Reportes máximos: ${maxReportsLabel}`"
            help="Oculta los focos que recibieron más reportes que este valor."
          >
            <USlider
              v-model="maxReports"
              :min="0"
              :max="MAX_REPORTS_BOUND"
              :step="1"
            />
          </UFormField>

          <UButton
            v-if="activeCount"
            size="xs"
            color="neutral"
            variant="link"
            icon="i-lucide-rotate-ccw"
            class="-ms-1.5 px-1.5"
            @click="reset"
          >
            Restablecer filtros
          </UButton>
        </div>
      </template>
    </UPopover>
  </div>
</template>
