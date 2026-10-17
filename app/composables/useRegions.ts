import type { GeoJsonObject } from "geojson";
import type { Region } from "~/types";

/** Argentina's provinces and departments, loaded once and shared by key. */
export function useRegions() {
  const config = useRuntimeConfig();
  const { data } = useFetch<Region[]>("/regions", {
    baseURL: config.public.apiBase,
    key: "regions",
    default: () => [],
    lazy: true,
  });
  const byCode = computed(() => new Map(data.value.map((r) => [r.code, r])));
  // Spanish order ("Córdoba" before "Corrientes"), whatever the database's.
  const sorted = computed(() =>
    [...data.value].sort((a, b) => a.name.localeCompare(b.name, "es")),
  );
  const provinces = computed(() =>
    sorted.value.filter((r) => r.province_code === null),
  );
  const departments = computed(() =>
    sorted.value.filter((r) => r.province_code !== null),
  );

  /** "Chaco", or "General Güemes, Chaco" for a department. */
  function regionLabel(region: Region): string {
    const province = region.province_code
      ? byCode.value.get(region.province_code)
      : null;
    return province ? `${region.name}, ${province.name}` : region.name;
  }

  return { regions: data, byCode, provinces, departments, regionLabel };
}

const outlines = new Map<string, Promise<GeoJsonObject>>();

/** A region's outline (GeoJSON), fetched once per code. */
export function fetchRegionOutline(code: string): Promise<GeoJsonObject> {
  let outline = outlines.get(code);
  if (!outline) {
    outline = $fetch<GeoJsonObject>(`/regions/${code}/geometry`, {
      baseURL: useRuntimeConfig().public.apiBase,
    });
    // A failed fetch shouldn't be cached: let the next call retry.
    outline.catch(() => outlines.delete(code));
    outlines.set(code, outline);
  }
  return outline;
}

/** [[south, west], [north, east]] of a GeoJSON geometry. */
export function outlineBounds(
  outline: GeoJsonObject,
): [[number, number], [number, number]] {
  let south = 90,
    west = 180,
    north = -90,
    east = -180;
  const visit = (coords: unknown): void => {
    if (typeof (coords as number[])[0] === "number") {
      const [lon, lat] = coords as [number, number];
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      west = Math.min(west, lon);
      east = Math.max(east, lon);
    } else (coords as unknown[]).forEach(visit);
  };
  visit((outline as unknown as { coordinates: unknown }).coordinates);
  return [
    [south, west],
    [north, east],
  ];
}
