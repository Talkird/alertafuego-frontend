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
