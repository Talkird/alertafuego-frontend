import type { ReportCategory, ReportVerdict } from "~/types";

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

export const REPORT_VERDICT_LABELS: Record<ReportVerdict, string> = {
  false_positive: "Falso positivo",
  confirmed_fire: "Incendio confirmado",
};

export const REPORT_VERDICT_OPTIONS = (
  Object.entries(REPORT_VERDICT_LABELS) as [ReportVerdict, string][]
).map(([value, label]) => ({ value, label }));