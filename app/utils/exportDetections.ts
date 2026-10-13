import { format } from "date-fns";
import type { Range, StoredDetection } from "~/types";

/** Argentina has no DST, so local time is always UTC-3. */
const ART_OFFSET_MS = -3 * 60 * 60 * 1000;

const isoUtc = (iso: string) => parseUtc(iso).toISOString();

/** "29/09/2026 17:00" in Argentina time: a value Spanish-locale Excel reads as a date. */
function argentinaTime(iso: string): string {
  const shifted = new Date(parseUtc(iso).getTime() + ART_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(shifted.getUTCDate())}/${pad(shifted.getUTCMonth() + 1)}/${shifted.getUTCFullYear()} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

/**
 * CSV for Excel in Spanish (Argentina): `;` between columns and a decimal
 * comma, which that locale expects; with `,` and `.` everything lands in one
 * column and 0.74 becomes 74. The BOM makes Excel read accents as UTF-8. QGIS
 * and pandas read it too (delimiter ";", decimal comma).
 */
export function detectionsToCsv(detections: StoredDetection[]): string {
  const decimal = (n: number, digits: number) =>
    n.toFixed(digits).replace(".", ",");
  const header = [
    "id",
    "latitud",
    "longitud",
    "probabilidad",
    "imagen_utc",
    "imagen_hora_argentina",
    "procesada_utc",
    "reportes",
  ];
  const rows = detections.map((d) => [
    d.id,
    decimal(d.lat, 5),
    decimal(d.lon, 5),
    decimal(d.probability, 4),
    isoUtc(d.image_time),
    argentinaTime(d.image_time),
    isoUtc(d.detected_at),
    d.report_count,
  ]);
  return "﻿" + [header, ...rows].map((r) => r.join(";")).join("\r\n");
}

/** GeoJSON FeatureCollection of points (WGS84, [lon, lat]), for QGIS and other GIS. */
export function detectionsToGeoJson(detections: StoredDetection[]): string {
  return JSON.stringify({
    type: "FeatureCollection",
    features: detections.map((d) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [d.lon, d.lat] },
      properties: {
        id: d.id,
        probability: d.probability,
        image_time: isoUtc(d.image_time),
        detected_at: isoUtc(d.detected_at),
        report_count: d.report_count,
      },
    })),
  });
}

/** e.g. "alertafuego-focos_2026-09-12_2026-10-12.csv" */
export function exportFileName(range: Range, extension: string): string {
  return `alertafuego-focos_${format(range.start, "yyyy-MM-dd")}_${format(range.end, "yyyy-MM-dd")}.${extension}`;
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
