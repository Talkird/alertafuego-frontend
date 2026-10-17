import type { HourStat, RegionKind, RegionStat, ReportStat } from "~/types";

export interface StatsQuery {
  since?: string;
  until?: string;
  /** A province or department. */
  region_code?: string;
  /** One of the user's alert zones: needs their token (placeHeaders). */
  area_id?: number;
}

/** The user's token when the query filters by one of their zones, else none:
 * the stats are public, and an expired token would fail them for no reason. */
export function placeHeaders(
  query: MaybeRefOrGetter<{ area_id?: number } | undefined>,
) {
  const session = useSupabaseSession();
  return computed((): Record<string, string> => {
    const token = session.value?.access_token;
    return toValue(query)?.area_id !== undefined && token
      ? { Authorization: `Bearer ${token}` }
      : {};
  });
}

// Same keying reasoning as useDetections: one stable key per endpoint, and
// `query` is what useFetch watches to refetch.
export function useRegionStats(
  query: MaybeRefOrGetter<StatsQuery & { kind: RegionKind }>,
) {
  const config = useRuntimeConfig();
  return useFetch<RegionStat[]>("/stats/regions", {
    baseURL: config.public.apiBase,
    query,
    headers: placeHeaders(query),
    default: () => [],
    key: "stats:regions",
  });
}

export function useHourlyStats(query: MaybeRefOrGetter<StatsQuery>) {
  const config = useRuntimeConfig();
  return useFetch<HourStat[]>("/stats/hourly", {
    baseURL: config.public.apiBase,
    query,
    headers: placeHeaders(query),
    default: () => [],
    key: "stats:hourly",
  });
}

export function useReportStats(query: MaybeRefOrGetter<StatsQuery>) {
  const config = useRuntimeConfig();
  return useFetch<ReportStat[]>("/stats/reports", {
    baseURL: config.public.apiBase,
    query,
    headers: placeHeaders(query),
    default: () => [],
    key: "stats:reports",
  });
}
