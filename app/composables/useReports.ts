import type { FetchError } from "ofetch";
import type { ReportPublic, ReportCreate } from "~/types";

export async function fetchReports(
  detectionId: number,
): Promise<ReportPublic[]> {
  const config = useRuntimeConfig();

  return $fetch<ReportPublic[]>(`/detections/${detectionId}/reports`, {
    baseURL: config.public.apiBase,
  });
}

export async function fetchMyReport(
  detectionId: number,
  accessToken: string,
): Promise<ReportPublic | null> {
  try {
    return await $fetch<ReportPublic>(
      `/detections/${detectionId}/reports/mine`,
      authFetchOptions(accessToken),
    );
  } catch (error) {
    if ((error as FetchError).statusCode === 404) return null;
    throw error;
  }
}

export async function createReport(
  detectionId: number,
  payload: ReportCreate,
  accessToken: string,
) {
  return $fetch<ReportPublic>(`/detections/${detectionId}/reports`, {
    ...authFetchOptions(accessToken),
    method: "POST",
    body: payload,
  });
}

export async function updateReport(
  detectionId: number,
  payload: ReportCreate,
  accessToken: string,
) {
  return $fetch<ReportPublic>(`/detections/${detectionId}/reports`, {
    ...authFetchOptions(accessToken),
    method: "PATCH",
    body: payload,
  });
}
