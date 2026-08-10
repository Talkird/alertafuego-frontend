import { toValue } from "vue";
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
  // collide on the same key. Key it explicitly off the route + real query
  // so each caller gets its own cache entry and always fetches fresh.
  const result = useFetch<StoredDetection[]>("/detections", {
    baseURL: config.public.apiBase,
    query,
    default: () => [],
    key: () =>
      `detections:${route.path}:${JSON.stringify(toValue(query) ?? {})}`,
  });

  // Force a real client-side fetch right after mount as a guarantee,
  // regardless of whatever the initial SSR/immediate fetch resolved to.
  onMounted(() => {
    result.refresh();
  });

  return result;
}