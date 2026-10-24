import { describe, expect, it } from "vitest";
import type { StoredDetection } from "~/types";
import {
  DEFAULT_MIN_CONFIDENCE,
  detectionColor,
  parseUtc,
} from "~/utils/detectionColor";
import {
  detectionsToCsv,
  detectionsToGeoJson,
  exportFileName,
} from "~/utils/exportDetections";
import { legalResponsible } from "~/utils/legal";
import { RECURRENCE_LEVELS, recurrenceLevel } from "~/utils/recurrence";
import {
  REPORT_CATEGORY_OPTIONS,
  REPORT_VERDICT_OPTIONS,
} from "~/utils/reportCategory";

const detection: StoredDetection = {
  id: 7,
  lat: -31.412346,
  lon: -64.198766,
  probability: 0.87654,
  image_time: "2026-10-01T02:30:00",
  detected_at: "2026-10-01T02:35:10",
  bbox: { west: -73.6, south: -55.1, east: -53.6, north: -21.8 },
  threshold: 0.5,
  report_count: 2,
  has_image: true,
};

describe("detectionColor", () => {
  it("uses the map legend's thresholds", () => {
    expect(detectionColor(0.95)).toBe("#dc2626");
    expect(detectionColor(0.8)).toBe("#dc2626");
    expect(detectionColor(0.79)).toBe("#f97316");
    expect(detectionColor(0.65)).toBe("#f97316");
    expect(detectionColor(0.5)).toBe("#facc15");
  });

  it("default minimum confidence is 50%", () => {
    expect(DEFAULT_MIN_CONFIDENCE).toBe(50);
  });
});

describe("parseUtc", () => {
  it("reads the backend's naive timestamps as UTC", () => {
    expect(parseUtc("2026-10-01T02:30:00").toISOString()).toBe(
      "2026-10-01T02:30:00.000Z",
    );
  });

  it("leaves timestamps that already say UTC unchanged", () => {
    expect(parseUtc("2026-10-01T02:30:00Z").toISOString()).toBe(
      "2026-10-01T02:30:00.000Z",
    );
  });
});

describe("recurrenceLevel", () => {
  it.each([
    [9, "5 días o más"],
    [5, "5 días o más"],
    [4, "3 a 4 días"],
    [2, "2 días"],
    [1, "1 día"],
    [0, "1 día"],
  ])("%i days -> %s", (days, label) => {
    expect(recurrenceLevel(days).label).toBe(label);
  });

  it("levels go from most to fewest days", () => {
    const minDays = RECURRENCE_LEVELS.map((l) => l.minDays);
    expect(minDays).toEqual([...minDays].sort((a, b) => b - a));
  });
});

describe("report labels", () => {
  it("offer every category and verdict the backend accepts", () => {
    expect(REPORT_CATEGORY_OPTIONS.map((o) => o.value)).toEqual([
      "industrial_activity",
      "controlled_burn",
      "gas_flare",
      "sun_glint",
      "sensor_noise",
      "other",
    ]);
    expect(REPORT_VERDICT_OPTIONS.map((o) => o.value)).toEqual([
      "false_positive",
      "confirmed_fire",
    ]);
  });
});

describe("export", () => {
  it("CSV has a header and Argentina local time", () => {
    const [header, row] = detectionsToCsv([detection]).split("\r\n");
    expect(header).toBe(
      "id,latitud,longitud,probabilidad,imagen_utc,imagen_hora_argentina,procesada_utc,reportes",
    );
    expect(row).toBe(
      "7,-31.41235,-64.19877,0.8765,2026-10-01T02:30:00.000Z,30/09/2026 23:30,2026-10-01T02:35:10.000Z,2",
    );
  });

  it("CSV of no detections is just the header", () => {
    expect(detectionsToCsv([]).split("\r\n")).toHaveLength(1);
  });

  it("GeoJSON points are [lon, lat]", () => {
    const geojson = JSON.parse(detectionsToGeoJson([detection]));
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features[0].geometry).toEqual({
      type: "Point",
      coordinates: [-64.198766, -31.412346],
    });
    expect(geojson.features[0].properties).toMatchObject({
      id: 7,
      report_count: 2,
      image_time: "2026-10-01T02:30:00.000Z",
    });
  });

  it("file name carries the range", () => {
    const range = { start: new Date(2026, 8, 12), end: new Date(2026, 9, 12) };
    expect(exportFileName(range, "csv")).toBe(
      "alertafuego-focos_2026-09-12_2026-10-12.csv",
    );
  });
});

describe("legalResponsible", () => {
  it("names the team and the project", () => {
    expect(legalResponsible()).toMatch(
      /^Juan Andrés Losauro y Tomás Ignacio Peña, integrantes del Proyecto Final/,
    );
  });
});
