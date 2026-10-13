import type { FetchOptions } from "ofetch";

let handlingExpiry = false;

/**
 * The backend answered 401: the token expired or was revoked while the page
 * was open. Clear the stale local session and send the user to log in again,
 * instead of leaving pages that look empty or "failed to load".
 */
export async function onSessionExpired() {
  if (handlingExpiry) return;
  handlingExpiry = true;
  try {
    await useSupabaseClient().auth.signOut({ scope: "local" });
    useToast().add({
      id: "session-expired",
      title: "Tu sesión expiró",
      description: "Ingresá de nuevo para seguir.",
      icon: "i-lucide-log-in",
      color: "warning",
    });
    await navigateTo("/login");
  } finally {
    handlingExpiry = false;
  }
}

/** $fetch options for an authenticated backend call. */
export function authFetchOptions(accessToken: string): FetchOptions<"json"> {
  return {
    baseURL: useRuntimeConfig().public.apiBase,
    headers: { Authorization: `Bearer ${accessToken}` },
    onResponseError({ response }) {
      if (response.status === 401) onSessionExpired();
    },
  };
}

/** Whether an error is the 401 already handled by onSessionExpired (no second toast). */
export function isUnauthorized(error: unknown): boolean {
  return (error as { statusCode?: number } | null)?.statusCode === 401;
}
