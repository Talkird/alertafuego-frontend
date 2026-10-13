/**
 * Toast when a data fetch fails, instead of silently showing an empty map or
 * chart. One fixed id, so a page with several failing fetches shows one toast.
 */
export function useFetchErrorToast(error: Ref<unknown>, title: string) {
  const toast = useToast();
  watch(error, (value) => {
    if (!value) return;
    toast.add({
      id: "fetch-error",
      title,
      description:
        "No se pudo conectar con el servidor. Probá de nuevo en unos minutos.",
      icon: "i-lucide-wifi-off",
      color: "error",
    });
  });
}
