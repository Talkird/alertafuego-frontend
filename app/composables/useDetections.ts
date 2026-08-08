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

  return useFetch<StoredDetection[]>("/detections", {
    baseURL: config.public.apiBase,
    query,
    default: () => [],
  });
}