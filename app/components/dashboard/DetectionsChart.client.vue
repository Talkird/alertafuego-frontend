<script setup lang="ts">
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
} from "date-fns";
import {
  VisXYContainer,
  VisLine,
  VisAxis,
  VisArea,
  VisCrosshair,
  VisTooltip,
} from "@unovis/vue";
import { useElementSize } from "@vueuse/core";
import type { Detection } from "~/utils/mockDetections";
import type { Period, Range } from "~/types";

const cardRef = useTemplateRef<HTMLElement | null>("cardRef");

const props = defineProps<{
  detections: Detection[];
  period: Period;
  range: Range;
}>();

type DataRecord = {
  date: Date;
  count: number;
};

const { width } = useElementSize(cardRef);

type BucketConfig = {
  each: (range: Range) => Date[];
  startOf: (date: Date) => Date;
  key: string;
  label: string;
};

const bucketConfig: Record<Period, BucketConfig> = {
  daily: {
    each: eachDayOfInterval,
    startOf: startOfDay,
    key: "yyyy-MM-dd",
    label: "d MMM",
  },
  weekly: {
    each: eachWeekOfInterval,
    startOf: startOfWeek,
    key: "yyyy-MM-dd",
    label: "d MMM",
  },
  monthly: {
    each: eachMonthOfInterval,
    startOf: startOfMonth,
    key: "yyyy-MM",
    label: "MMM yyyy",
  },
  yearly: {
    each: eachYearOfInterval,
    startOf: startOfYear,
    key: "yyyy",
    label: "yyyy",
  },
};

const data = computed<DataRecord[]>(() => {
  const { each, startOf, key } = bucketConfig[props.period];
  const buckets = each(props.range);

  const counts = new Map<string, number>();
  for (const detection of props.detections) {
    const bucketKey = format(startOf(new Date(detection.image_time)), key);
    counts.set(bucketKey, (counts.get(bucketKey) ?? 0) + 1);
  }

  return buckets.map((date) => ({
    date,
    count: counts.get(format(startOf(date), key)) ?? 0,
  }));
});

const x = (_: DataRecord, i: number) => i;
const y = (d: DataRecord) => d.count;

const total = computed(() => props.detections.length);

const formatDate = (date: Date): string =>
  format(date, bucketConfig[props.period].label);

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) {
    return "";
  }

  return formatDate(data.value[i].date);
};

const template = (d: DataRecord) =>
  `${formatDate(d.date)}: ${d.count} foco${d.count === 1 ? "" : "s"}`;
</script>

<template>
  <UCard
    ref="cardRef"
    :ui="{ root: 'overflow-visible', body: 'px-0! pt-0! pb-3!' }"
  >
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">Focos detectados</p>
        <p class="text-3xl text-highlighted font-semibold">{{ total }}</p>
      </div>
    </template>

    <VisXYContainer
      :data="data"
      :padding="{ top: 40 }"
      :margin="{ left: -5, right: -5 }"
      class="h-96"
      :width="width"
    >
      <VisLine :x="x" :y="y" color="var(--ui-primary)" />
      <VisArea :x="x" :y="y" color="var(--ui-primary)" :opacity="0.1" />

      <VisAxis type="x" :x="x" :tick-format="xTicks" />

      <VisCrosshair color="var(--ui-primary)" :template="template" />

      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
