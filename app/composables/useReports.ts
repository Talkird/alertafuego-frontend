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
  const config = useRuntimeConfig();

  try {
    return await $fetch<ReportPublic>(
      `/detections/${detectionId}/reports/mine`,
      {
        baseURL: config.public.apiBase,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
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
  const config = useRuntimeConfig();

  return $fetch<ReportPublic>(`/detections/${detectionId}/reports`, {
    baseURL: config.public.apiBase,
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}

export async function updateReport(
  detectionId: number,
  payload: ReportCreate,
  accessToken: string,
) {
  const config = useRuntimeConfig();

  return $fetch<ReportPublic>(`/detections/${detectionId}/reports`, {
    baseURL: config.public.apiBase,
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}