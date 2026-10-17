/** Recurrence map levels, by distinct days with fire. Purple, so they never read
 * as the detections' yellow-to-red probability colors. */
export const RECURRENCE_LEVELS = [
  { label: "5 días o más", minDays: 5, color: "#4a044e", radius: 12 },
  { label: "3 a 4 días", minDays: 3, color: "#86198f", radius: 10 },
  { label: "2 días", minDays: 2, color: "#c026d3", radius: 8 },
  { label: "1 día", minDays: 1, color: "#e879f9", radius: 6 },
];

export function recurrenceLevel(fireDays: number) {
  return (
    RECURRENCE_LEVELS.find((level) => fireDays >= level.minDays) ??
    RECURRENCE_LEVELS.at(-1)!
  );
}
