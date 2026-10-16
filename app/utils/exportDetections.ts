import { format } from "date-fns";
import writeExcelFile from "write-excel-file/browser";
import type { Range, StoredDetection } from "~/types";

/** Argentina has no DST, so local time is always UTC-3. */
const ART_OFFSET_MS = -3 * 60 * 60 * 1000;

const isoUtc = (iso: string) => parseUtc(iso).toISOString();

/** "29/09/2026 17:00" in Argentina time. */
function argentinaTime(iso: string): string {
  const shifted = new Date(parseUtc(iso).getTime() + ART_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(shifted.getUTCDate())}/${pad(shifted.getUTCMonth() + 1)}/${shifted.getUTCFullYear()} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

/**
 * Plain CSV (`,` between columns, decimal point) for pandas, QGIS and other
 * tools. Spreadsheet apps read numbers in CSV with the viewer's locale, so
 * Excel users get the .xlsx export instead, which stores real numbers.
 */
export function detectionsToCsv(detections: StoredDetection[]): string {
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
    d.lat.toFixed(5),
    d.lon.toFixed(5),
    d.probability.toFixed(4),
    isoUtc(d.image_time),
    argentinaTime(d.image_time),
    isoUtc(d.detected_at),
    d.report_count,
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\r\n");
}

/**
 * Excel workbook with typed cells: numbers and dates display correctly in any
 * locale (Excel, Numbers, Google Sheets). Probability is stored as a fraction
 * and shown as a percentage, as in the app.
 */
export function detectionsToXlsx(detections: StoredDetection[]): Promise<Blob> {
  const header = [
    "ID",
    "Latitud",
    "Longitud",
    "Probabilidad",
    "Imagen (UTC)",
    "Imagen (hora Argentina)",
    "Procesada (UTC)",
    "Reportes",
  ].map((value) => ({ value, fontWeight: "bold" as const }));
  const dateCell = (date: Date) => ({ value: date, type: Date });
  const rows = detections.map((d) => [
    d.id,
    { value: d.lat, format: "0.00000" },
    { value: d.lon, format: "0.00000" },
    { value: d.probability, format: "0.0%" },
    dateCell(parseUtc(d.image_time)),
    // Excel dates carry no time zone: shift so the cell reads Argentina time.
    dateCell(new Date(parseUtc(d.image_time).getTime() + ART_OFFSET_MS)),
    dateCell(parseUtc(d.detected_at)),
    d.report_count,
  ]);
  return writeExcelFile([header, ...rows], {
    sheet: "Focos",
    dateFormat: "dd/mm/yyyy hh:mm",
    stickyRowsCount: 1,
    columns: [8, 11, 11, 13, 18, 22, 18, 10].map((width) => ({ width })),
  }).toBlob();
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

export function downloadFile(name: string, content: string | Blob, type: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
