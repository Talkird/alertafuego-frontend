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
import { es } from "date-fns/locale";
import {
  VisXYContainer,
  VisLine,
  VisAxis,
  VisArea,
  VisCrosshair,
  VisTooltip,
} from "@unovis/vue";
import { CurveType } from "@unovis/ts";
import { useElementSize } from "@vueuse/core";
import type { Period, Range, StoredDetection } from "~/types";

const cardRef = useTemplateRef<HTMLElement | null>("cardRef");

const props = defineProps<{
  detections: StoredDetection[];
  period: Period;
  range: Range;
  /** First load or a new range: the data isn't there yet. Without this the card
   * showed "0" and a flat line, as if the period had no fires. */
  loading?: boolean;
}>();

type DataRecord = {
  date: Date;
  count: number;
};

const { width } = useElementSize(cardRef);

// Fixed (not random) so the placeholder doesn't change on every load.
const SKELETON_BARS = [
  22, 30, 18, 36, 48, 34, 26, 40, 58, 44, 30, 26, 36, 52, 70, 56, 40, 32, 28,
  44, 62, 48, 36, 30, 24, 38, 50, 42, 28, 20,
];

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
    const bucketKey = format(startOf(parseUtc(detection.image_time)), key);
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
  format(date, bucketConfig[props.period].label, { locale: es });

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
      <div :aria-busy="loading">
        <p class="text-muted mb-1 text-sm">Focos detectados</p>
        <!-- Same box as the number (text-3xl: 36px line), so nothing moves when
             it arrives. Skeletons are hidden from assistive tech: each one
             announces an English "loading"; the sr-only line says it once. -->
        <USkeleton v-if="loading" aria-hidden="true" class="h-9 w-16" />
        <p v-else class="text-highlighted text-3xl font-semibold">
          {{ total }}
        </p>
        <p v-if="loading" class="sr-only" aria-live="polite">
          Cargando focos detectados…
        </p>
      </div>
    </template>

    <!-- Chart-shaped placeholder at the chart's exact height (h-72): bars on a
         baseline and axis labels, so it reads as "a chart is loading" rather
         than an empty box. -->
    <div
      v-if="loading"
      aria-hidden="true"
      class="flex h-72 flex-col px-4 pt-10 pb-3 sm:px-6"
    >
      <div class="border-default flex flex-1 items-end gap-1 border-b">
        <USkeleton
          v-for="(height, i) in SKELETON_BARS"
          :key="i"
          class="flex-1 rounded-b-none"
          :style="{ height: `${height}%` }"
        />
      </div>
      <div class="flex justify-around pt-3">
        <USkeleton v-for="i in 5" :key="i" class="h-3 w-10" />
      </div>
    </div>

    <VisXYContainer
      v-else
      :data="data"
      :padding="{ top: 40 }"
      :margin="{ left: -5, right: -5 }"
      class="h-72"
      :width="width"
    >
      <VisLine
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :curve-type="CurveType.Linear"
      />
      <VisArea
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :opacity="0.1"
        :curve-type="CurveType.Linear"
      />

      <VisAxis type="x" :x="x" :tick-format="xTicks" :grid-line="false" />

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
