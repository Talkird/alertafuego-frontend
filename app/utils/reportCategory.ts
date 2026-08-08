import type { ReportCategory } from "~/types";

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  industrial_activity: "Actividad industrial",
  controlled_burn: "Quema controlada",
  gas_flare: "Antorcha de gas",
  sun_glint: "Reflejo solar",
  sensor_noise: "Ruido de sensor",
  other: "Otro",
};

export const REPORT_CATEGORY_OPTIONS = (
  Object.entries(REPORT_CATEGORY_LABELS) as [ReportCategory, string][]
).map(([value, label]) => ({ value, label }));