import type { AccountSettings, TelegramLink } from "~/types";

export async function fetchAccount(accessToken: string) {
  return $fetch<AccountSettings>("/account", authFetchOptions(accessToken));
}

export async function setEmailAlerts(enabled: boolean, accessToken: string) {
  return $fetch<AccountSettings>("/account", {
    ...authFetchOptions(accessToken),
    method: "PATCH",
    body: { email_alerts: enabled },
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

/** A one-time link to the bot: pressing Start in Telegram connects the chat. */
export async function createTelegramLink(accessToken: string) {
  return $fetch<TelegramLink>("/account/telegram/link", {
    ...authFetchOptions(accessToken),
    method: "POST",
  });
}

export async function disconnectTelegram(accessToken: string) {
  return $fetch<AccountSettings>("/account/telegram", {
    ...authFetchOptions(accessToken),
    method: "DELETE",
  });
}

export async function sendTelegramTest(accessToken: string) {
  return $fetch("/account/telegram/test", {
    ...authFetchOptions(accessToken),
    method: "POST",
  });
}
