import { endOfDay, startOfDay, sub } from "date-fns";
import type { Range } from "~/types";

/** Filters shared across pages, so the map and the statistics show the same period. */
export const useFiltersStore = defineStore("filters", () => {
  const range = shallowRef<Range>({
    start: sub(new Date(), { days: 30 }),
    end: new Date(),
  });

  // Whole days: the picker's dates are at 00:00, so querying up to `end` as-is
  // dropped the last day (today, with a preset like "Últimos 7 días"), and a
  // page left open never saw detections newer than when it loaded.
  const query = computed(() => ({
    since: startOfDay(range.value.start).toISOString(),
    until: endOfDay(range.value.end).toISOString(),
  }));

  return { range, query };
});
