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
}>();

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

const tooltip = (d: HourStat) =>
  `${pad(d.hour)}:00–${pad(d.hour)}:59: ${d.detection_count} foco${d.detection_count === 1 ? "" : "s"}`;
</script>

<template>
  <UCard :ui="{ root: 'overflow-visible', body: 'pb-3!' }">
    <template #header>
      <div>
        <p class="text-muted mb-1.5 text-xs uppercase">
          Focos por hora del día (hora argentina)
        </p>
        <p class="text-highlighted text-sm">
          <template v-if="busiest">
            Hora con más focos: {{ pad(busiest.hour) }} h
          </template>
          <span v-else class="text-muted">Sin focos en este período.</span>
        </p>
      </div>
    </template>

    <VisXYContainer :data="hours" class="h-56">
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
