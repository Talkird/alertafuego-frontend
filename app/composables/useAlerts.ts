import type {
  Alert,
  AlertArea,
  AlertAreaCreate,
  AlertAreaUpdate,
} from "~/types";

function authOptions(accessToken: string) {
  const config = useRuntimeConfig();
  return {
    baseURL: config.public.apiBase,
    headers: { Authorization: `Bearer ${accessToken}` },
  };
}

export async function fetchAlertAreas(accessToken: string) {
  return $fetch<AlertArea[]>("/alert-areas", authOptions(accessToken));
}

export async function createAlertArea(
  payload: AlertAreaCreate,
  accessToken: string,
) {
  return $fetch<AlertArea>("/alert-areas", {
    ...authOptions(accessToken),
    method: "POST",
    body: payload,
  });
}

export async function updateAlertArea(
  id: number,
  payload: AlertAreaUpdate,
  accessToken: string,
) {
  return $fetch<AlertArea>(`/alert-areas/${id}`, {
    ...authOptions(accessToken),
    method: "PATCH",
    body: payload,
  });
}

export async function deleteAlertArea(id: number, accessToken: string) {
  return $fetch(`/alert-areas/${id}`, {
    ...authOptions(accessToken),
    method: "DELETE",
  });
}

export async function fetchAlerts(accessToken: string) {
  return $fetch<Alert[]>("/alerts", authOptions(accessToken));
}
