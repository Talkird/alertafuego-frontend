import { sub } from "date-fns";
import type { Range } from "~/types";

/** Filters shared across pages, so the map and the dashboard show the same period. */
export const useFiltersStore = defineStore("filters", () => {
  const range = shallowRef<Range>({
    start: sub(new Date(), { days: 30 }),
    end: new Date(),
  });

  return { range };
});
