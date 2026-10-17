import type { GeoJsonObject } from "geojson";
import type { Region } from "~/types";
// Exported from the backend's regions table (backend.scripts.export_regions):
// shipped with the app, so no request is needed to list them.
import regionList from "~/data/regions.json";

const regions = regionList as Region[];
const byCode = new Map(regions.map((r) => [r.code, r]));
// Spanish order ("Córdoba" before "Corrientes").
const sorted = [...regions].sort((a, b) => a.name.localeCompare(b.name, "es"));
const provinces = sorted.filter((r) => r.province_code === null);
const departments = sorted.filter((r) => r.province_code !== null);

/** "Chaco", or "General Güemes, Chaco" for a department. */
function regionLabel(region: Region): string {
  const province = region.province_code
    ? byCode.get(region.province_code)
    : null;
  return province ? `${region.name}, ${province.name}` : region.name;
}

/** Argentina's provinces and departments (IGN). */
export function useRegions() {
  return { regions, byCode, provinces, departments, regionLabel };
}

const outlines = new Map<string, Promise<GeoJsonObject>>();

/** A region's outline (GeoJSON), loaded once per code. */
export function fetchRegionOutline(code: string): Promise<GeoJsonObject> {
  let outline = outlines.get(code);
  if (!outline) {
    // A static file served with the site (public/regions), not the API.
    outline = $fetch<GeoJsonObject>(`/regions/${code}.json`, {
      baseURL: useRuntimeConfig().app.baseURL,
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
