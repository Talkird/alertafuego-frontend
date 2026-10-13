/**
 * The Supabase module only checks for a session on navigation. If the session
 * ends while a protected page is open (signed out in another tab, refresh
 * token expired or revoked), leave for /login right away instead of staying
 * on a page whose data can no longer load. Same open pages as the module's
 * redirect (login, callback and `exclude`).
 */
export default defineNuxtPlugin(() => {
  const session = useSupabaseSession();
  const route = useRoute();
  const { login, callback, exclude } =
    useRuntimeConfig().public.supabase.redirectOptions;

  const isOpen = (path: string) =>
    [login, callback, ...(exclude ?? [])].some(
      (pattern) =>
        pattern && new RegExp(`^${pattern.replace(/\*/g, ".*")}$`).test(path),
    );

  watch(session, (current, previous) => {
    if (current || !previous || isOpen(route.path)) return;
    navigateTo(login);
  });
});
