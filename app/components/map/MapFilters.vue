<script setup lang="ts">
import type { Range } from "~/types";

const range = defineModel<Range>("range", { required: true });
const minConfidence = defineModel<number>("minConfidence", { required: true });
const maxReports = defineModel<number>("maxReports", { required: true });

const MAX_REPORTS_BOUND = 20;

const maxReportsLabel = computed(() =>
  maxReports.value >= MAX_REPORTS_BOUND
    ? "Sin límite"
    : String(maxReports.value),
);
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <DashboardDateRangePicker v-model="range" class="-ms-1" />

    <UPopover>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-gauge"
        truncate
        :label="`Confianza mínima: ${minConfidence}%`"
        class="w-60 justify-start tabular-nums data-[state=open]:bg-elevated"
      />

      <template #content>
        <div class="w-56 space-y-2 p-4">
          <p class="text-xs text-muted">Confianza mínima</p>
          <USlider v-model="minConfidence" :min="0" :max="100" :step="5" />
        </div>
      </template>
    </UPopover>

    <UPopover>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-flag"
        truncate
        :label="`Reportes máximos: ${maxReportsLabel}`"
        class="w-64 justify-start tabular-nums data-[state=open]:bg-elevated"
      />

      <template #content>
        <div class="w-56 space-y-2 p-4">
          <p class="text-xs text-muted">Reportes máximos</p>
          <USlider
            v-model="maxReports"
            :min="0"
            :max="MAX_REPORTS_BOUND"
            :step="1"
          />
        </div>
      </template>
    </UPopover>
  </div>
</template>
