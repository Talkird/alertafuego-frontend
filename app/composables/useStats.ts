import type { HourStat, RegionKind, RegionStat, ReportStat } from "~/types";

export interface StatsQuery {
  since?: string;
  until?: string;
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
    default: () => [],
    key: "stats:regions",
  });
}

export function useHourlyStats(query: MaybeRefOrGetter<StatsQuery>) {
  const config = useRuntimeConfig();
  return useFetch<HourStat[]>("/stats/hourly", {
    baseURL: config.public.apiBase,
    query,
    default: () => [],
    key: "stats:hourly",
  });
}

export function useReportStats(query: MaybeRefOrGetter<StatsQuery>) {
  const config = useRuntimeConfig();
  return useFetch<ReportStat[]>("/stats/reports", {
    baseURL: config.public.apiBase,
    query,
    default: () => [],
    key: "stats:reports",
  });
}
