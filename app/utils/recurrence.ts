/** Recurrence map levels, by distinct days with fire: Tailwind's violet scale,
 * apart from the detections' yellow-to-red probability colors. Drawn like Nuxt
 * UI's "subtle" variant, a light fill with a solid outline of the same color. */
export const RECURRENCE_LEVELS = [
  { label: "5 días o más", minDays: 5, color: "#5d0ec0", radius: 11 }, // violet-800
  { label: "3 a 4 días", minDays: 3, color: "#7f22fe", radius: 9 }, // violet-600
  { label: "2 días", minDays: 2, color: "#8e51ff", radius: 7 }, // violet-500
  { label: "1 día", minDays: 1, color: "#a684ff", radius: 5 }, // violet-400
];

export function recurrenceLevel(fireDays: number) {
  return (
    RECURRENCE_LEVELS.find((level) => fireDays >= level.minDays) ??
    RECURRENCE_LEVELS.at(-1)!
  );
}
