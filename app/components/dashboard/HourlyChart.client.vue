<script setup lang="ts">
import { StackedBar } from "@unovis/ts";
import {
  VisAxis,
  VisStackedBar,
  VisTooltip,
  VisXYContainer,
} from "@unovis/vue";
import type { HourStat } from "~/types";

const props = defineProps<{
  hours: HourStat[];
  loading?: boolean;
}>();

// One placeholder bar per hour, fixed heights so it looks the same each load.
const SKELETON_BARS = [
  14, 10, 8, 8, 10, 16, 24, 34, 46, 58, 70, 82, 92, 96, 88, 76, 62, 50, 40, 32,
  26, 22, 18, 16,
];

const x = (d: HourStat) => d.hour;
const y = (d: HourStat) => d.detection_count;

const busiest = computed(() =>
  props.hours.reduce<HourStat | null>(
    (best, d) => (d.detection_count > (best?.detection_count ?? 0) ? d : best),
    null,
  ),
);

const pad = (hour: number) => String(hour).padStart(2, "0");

const xTicks = (hour: number) => (hour % 3 === 0 ? `${pad(hour)} h` : "");

// StackedBar hands its tooltip a wrapper per bar ({ datum, index, stacked,
// stackIndex }), not the data row itself.
const tooltip = ({ datum: d }: { datum: HourStat }) =>
  `${pad(d.hour)}:00–${pad(d.hour)}:59: ${d.detection_count} foco${d.detection_count === 1 ? "" : "s"}`;
</script>

<template>
  <UCard :ui="{ root: 'overflow-visible', body: 'pb-3!' }">
    <template #header>
      <div>
        <p class="text-muted mb-1 text-sm">
          Focos por hora del día, hora argentina
        </p>
        <USkeleton v-if="loading" aria-hidden="true" class="h-7 w-52" />
        <p v-if="loading" class="sr-only" aria-live="polite">
          Cargando focos por hora…
        </p>
        <p v-else class="text-highlighted text-lg font-semibold">
          <template v-if="busiest">
            Hora con más focos: {{ pad(busiest.hour) }} h
          </template>
          <span v-else class="text-muted">Sin focos en este período.</span>
        </p>
      </div>
    </template>

    <div v-if="loading" aria-hidden="true" class="flex h-56 flex-col pt-4">
      <div class="border-default flex flex-1 items-end gap-1.5 border-b">
        <USkeleton
          v-for="(height, i) in SKELETON_BARS"
          :key="i"
          class="flex-1 rounded-b-none"
          :style="{ height: `${height}%` }"
        />
      </div>
      <div class="flex justify-between pt-3">
        <USkeleton v-for="i in 8" :key="i" class="h-3 w-8" />
      </div>
    </div>

    <VisXYContainer v-else :data="hours" class="h-56">
      <VisStackedBar
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :rounded-corners="4"
        :bar-padding="0.2"
      />
      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
        :num-ticks="24"
        :grid-line="false"
      />
      <VisAxis
        type="y"
        :num-ticks="3"
        :tick-format="(v: number) => (Number.isInteger(v) ? String(v) : '')"
      />
      <VisTooltip :triggers="{ [StackedBar.selectors.bar]: tooltip }" />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
