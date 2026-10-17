import { endOfDay, startOfDay, sub } from "date-fns";
import type { Place, Range } from "~/types";

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

  // Estadísticas: the whole country, a province or department, or one of the
  // user's alert zones. Not part of `query`: the map always shows the country.
  const place = ref<Place>({ kind: "country" });
  const placeQuery = computed(() => {
    const value = place.value;
    if (value.kind === "region") return { region_code: value.code };
    if (value.kind === "area") return { area_id: value.id };
    return {};
  });

  return { range, query, place, placeQuery };
});
