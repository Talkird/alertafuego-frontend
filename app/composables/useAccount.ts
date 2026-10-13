import type { AccountSettings, AccountSettingsUpdate } from "~/types";

export async function fetchAccount(accessToken: string) {
  return $fetch<AccountSettings>("/account", authFetchOptions(accessToken));
}

export async function updateAccount(
  payload: AccountSettingsUpdate,
  accessToken: string,
) {
  return $fetch<AccountSettings>("/account", {
    ...authFetchOptions(accessToken),
    method: "PATCH",
    body: payload,
  });
}

/** Ask for alerts at another address; it applies once its emailed link is opened. */
export async function requestAlertEmail(email: string, accessToken: string) {
  return $fetch<AccountSettings>("/account/alert-email", {
    ...authFetchOptions(accessToken),
    method: "POST",
    body: { email },
  });
}

/** Back to the account's own address. */
export async function resetAlertEmail(accessToken: string) {
  return $fetch<AccountSettings>("/account/alert-email", {
    ...authFetchOptions(accessToken),
    method: "DELETE",
  });
}

export async function cancelPendingAlertEmail(accessToken: string) {
  return $fetch<AccountSettings>("/account/alert-email/pending", {
    ...authFetchOptions(accessToken),
    method: "DELETE",
  });
}

/** Opened from the emailed link: needs no login, the token is the proof. */
export async function confirmAlertEmail(token: string) {
  return $fetch<{ email: string }>("/account/alert-email/confirm", {
    baseURL: useRuntimeConfig().public.apiBase,
    method: "POST",
    body: { token },
  });
}
