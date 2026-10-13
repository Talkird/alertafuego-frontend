import type {
  Alert,
  AlertArea,
  AlertAreaCreate,
  AlertAreaUpdate,
} from "~/types";

export async function fetchAlertAreas(accessToken: string) {
  return $fetch<AlertArea[]>("/alert-areas", authFetchOptions(accessToken));
}

export async function createAlertArea(
  payload: AlertAreaCreate,
  accessToken: string,
) {
  return $fetch<AlertArea>("/alert-areas", {
    ...authFetchOptions(accessToken),
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
    ...authFetchOptions(accessToken),
    method: "PATCH",
    body: payload,
  });
}

export async function deleteAlertArea(id: number, accessToken: string) {
  return $fetch(`/alert-areas/${id}`, {
    ...authFetchOptions(accessToken),
    method: "DELETE",
  });
}

export async function fetchAlerts(accessToken: string) {
  return $fetch<Alert[]>("/alerts", authFetchOptions(accessToken));
}
