/** The browser's current position, with toasts when it isn't available. */
export function useMyLocation() {
  const toast = useToast();
  const locating = ref(false);

  function locate(onFound: (lat: number, lon: number) => void) {
    if (!navigator.geolocation) {
      toast.add({
        title: "Tu navegador no comparte ubicación",
        color: "warning",
      });
      return;
    }
    locating.value = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locating.value = false;
        onFound(position.coords.latitude, position.coords.longitude);
      },
      () => {
        locating.value = false;
        toast.add({
          title: "No se pudo obtener tu ubicación",
          description: "Revisá que el navegador tenga permiso de ubicación.",
          color: "warning",
        });
      },
    );
  }

  return { locating, locate };
}
