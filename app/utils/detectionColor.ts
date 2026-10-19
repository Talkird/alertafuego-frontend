/** Marker color for a detection, by model probability (map and alerts). */
export function detectionColor(probability: number): string {
  if (probability >= 0.8) return "#dc2626";
  if (probability >= 0.65) return "#f97316";
  return "#facc15";
}

/** Parses the backend's naive-UTC ISO timestamps as UTC. */
export function parseUtc(iso: string): Date {
  return new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
}

/** The map's default minimum probability filter, in percent. Lower-probability
 * detections are mostly false positives; users can lower it in the filters. */
export const DEFAULT_MIN_CONFIDENCE = 50;
