export type Period = "daily" | "weekly" | "monthly" | "yearly";

export interface Range {
  start: Date;
  end: Date;
}

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface StoredDetection {
  id: number;
  lat: number;
  lon: number;
  probability: number;
  image_time: string;
  detected_at: string;
  bbox: BBox;
  threshold: number;
  report_count: number;
  has_image: boolean;
}

export type ReportCategory =
  | "industrial_activity"
  | "controlled_burn"
  | "gas_flare"
  | "sun_glint"
  | "sensor_noise"
  | "other";

export type ReportVerdict = "false_positive" | "confirmed_fire";

export interface ReportPublic {
  id: number;
  verdict: ReportVerdict;
  category: ReportCategory | null;
  comment: string | null;
  created_at: string;
}

export interface ReportCreate {
  verdict: ReportVerdict;
  category?: ReportCategory | null;
  comment?: string | null;
}

export interface AlertArea {
  id: number;
  name: string;
  email: string;
  lat: number;
  lon: number;
  radius_km: number;
  min_probability: number;
  active: boolean;
  created_at: string;
}

export interface AlertAreaCreate {
  name: string;
  lat: number;
  lon: number;
  radius_km: number;
  min_probability: number;
}

export type AlertAreaUpdate = Partial<AlertAreaCreate> & { active?: boolean };

export interface Alert {
  id: number;
  area_id: number;
  area_name: string;
  created_at: string;
  emailed: boolean;
  detection: StoredDetection;
}

export type RegionKind = "province" | "department";

export interface RegionStat {
  code: string;
  name: string;
  province_name: string | null;
  detection_count: number;
  max_probability: number;
}

export interface HourStat {
  hour: number;
  detection_count: number;
}

export interface ReportStat {
  verdict: ReportVerdict;
  category: ReportCategory | null;
  report_count: number;
}

/** An alert area being created (id null) or edited, in the form. */
export interface AreaDraft {
  id: number | null;
  name: string;
  /** null until picked on the map or from the browser's location. */
  lat: number | null;
  lon: number | null;
  radius_km: number;
  min_probability: number;
}
