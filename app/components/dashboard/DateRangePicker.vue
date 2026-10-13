<script setup lang="ts">
import {
  DateFormatter,
  getLocalTimeZone,
  CalendarDate,
  today,
} from "@internationalized/date";
import type { Range } from "~/types";

const df = new DateFormatter("es-AR", { dateStyle: "medium" });
const dfNoYear = new DateFormatter("es-AR", { day: "numeric", month: "short" });

// "12 sept - 12 oct 2026": the year once when both ends share it, so the label
// fits in the toolbar on phones. (Intl's own formatRange is longer in Spanish.)
const formatRange = (start: Date, end: Date) =>
  start.getFullYear() === end.getFullYear()
    ? `${dfNoYear.format(start)} - ${df.format(end)}`
    : `${df.format(start)} - ${df.format(end)}`;

const selected = defineModel<Range>({ required: true });

const ranges = [
  { label: "Últimos 7 días", days: 7 },
  { label: "Últimos 14 días", days: 14 },
  { label: "Últimos 30 días", days: 30 },
  { label: "Últimos 3 meses", months: 3 },
  { label: "Últimos 6 meses", months: 6 },
  { label: "Último año", years: 1 },
];

const toCalendarDate = (date: Date) =>
  new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

const calendarRange = computed({
  get: () => ({
    start: selected.value.start
      ? toCalendarDate(selected.value.start)
      : undefined,
    end: selected.value.end ? toCalendarDate(selected.value.end) : undefined,
  }),
  set: (newValue: { start: CalendarDate | null; end: CalendarDate | null }) => {
    selected.value = {
      start: newValue.start
        ? newValue.start.toDate(getLocalTimeZone())
        : new Date(),
      end: newValue.end ? newValue.end.toDate(getLocalTimeZone()) : new Date(),
    };
  },
});

const isRangeSelected = (range: {
  days?: number;
  months?: number;
  years?: number;
}) => {
  if (!selected.value.start || !selected.value.end) return false;

  const currentDate = today(getLocalTimeZone());
  let startDate = currentDate.copy();

  if (range.days) startDate = startDate.subtract({ days: range.days });
  else if (range.months)
    startDate = startDate.subtract({ months: range.months });
  else if (range.years) startDate = startDate.subtract({ years: range.years });

  const selectedStart = toCalendarDate(selected.value.start);
  const selectedEnd = toCalendarDate(selected.value.end);

  return (
    selectedStart.compare(startDate) === 0 &&
    selectedEnd.compare(currentDate) === 0
  );
};

const selectRange = (range: {
  days?: number;
  months?: number;
  years?: number;
}) => {
  const endDate = today(getLocalTimeZone());
  let startDate = endDate.copy();

  if (range.days) startDate = startDate.subtract({ days: range.days });
  else if (range.months)
    startDate = startDate.subtract({ months: range.months });
  else if (range.years) startDate = startDate.subtract({ years: range.years });

  selected.value = {
    start: startDate.toDate(getLocalTimeZone()),
    end: endDate.toDate(getLocalTimeZone()),
  };
};
</script>

<template>
  <UPopover :content="{ align: 'start' }" :modal="true">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-calendar"
      class="data-[state=open]:bg-elevated group"
    >
      <span class="truncate">
        <template v-if="selected.start">
          <template v-if="selected.end">
            {{ formatRange(selected.start, selected.end) }}
          </template>
          <template v-else>
            {{ df.format(selected.start) }}
          </template>
        </template>
        <template v-else> Elegir fecha </template>
      </span>

      <template #trailing>
        <UIcon
          name="i-lucide-chevron-down"
          class="text-dimmed size-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </template>
    </UButton>

    <template #content>
      <div class="divide-default flex items-stretch sm:divide-x">
        <div class="hidden flex-col justify-center sm:flex">
          <UButton
            v-for="(range, index) in ranges"
            :key="index"
            :label="range.label"
            color="neutral"
            variant="ghost"
            class="rounded-none px-4"
            :class="[
              isRangeSelected(range) ? 'bg-elevated' : 'hover:bg-elevated/50',
            ]"
            truncate
            @click="selectRange(range)"
          />
        </div>

        <UCalendar
          v-model="calendarRange"
          class="p-2"
          :number-of-months="2"
          range
        />
      </div>
    </template>
  </UPopover>
</template>
