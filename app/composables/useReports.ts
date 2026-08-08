import type { ReportPublic, ReportCreate } from "~/types";

// Fallback usado si el backend no responde (ver TODO.md)
const MOCK_REPORTS: ReportPublic[] = [
  {
    id: -1,
    category: "sensor_noise",
    comment:
      "Dato de ejemplo: el backend no está disponible en este momento.",
    created_at: new Date().toISOString(),
  },
];

export async function fetchReports(
  detectionId: number,
): Promise<{ reports: ReportPublic[]; isMock: boolean }> {
  const config = useRuntimeConfig();

  try {
    const reports = await $fetch<ReportPublic[]>(
      `/detections/${detectionId}/reports`,
      { baseURL: config.public.apiBase },
    );
    return { reports, isMock: false };
  } catch {
    return { reports: MOCK_REPORTS, isMock: true };
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