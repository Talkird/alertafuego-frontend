import type { StoredDetection } from "~/types";

export interface DetectionsQuery {
  west?: number;
  south?: number;
  east?: number;
  north?: number;
  since?: string;
  until?: string;
  limit?: number;
}

export function useDetections(
  query?: MaybeRefOrGetter<DetectionsQuery | undefined>,
) {
  const config = useRuntimeConfig();
  const route = useRoute();

  // useFetch auto-derives its cache key from this file's source location,
  // so every caller of this composable (Mapa, Dashboard) would otherwise
  // collide on the same key. `key` identifies the logical resource and
  // must be a stable string per caller — `query` is what useFetch already
  // watches reactively to decide when to refetch, so the key doesn't need
  // to (and shouldn't) change with it.
  return useFetch<StoredDetection[]>("/detections", {
    baseURL: config.public.apiBase,
    query,
    default: () => [],
    key: `detections:${route.path}`,
  });
}