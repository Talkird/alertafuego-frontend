export type BaseLayer = "map" | "satellite";

export type WeatherLayer =
  "temp_new" | "wind_new" | "clouds_new" | "precipitation_new";

export interface WeatherLayerInfo {
  value: WeatherLayer;
  label: string;
  unit: string;
  /** Color stops of OpenWeatherMap's default palette for this layer. */
  stops: { value: number; color: string }[];
}

// OpenWeatherMap's free tile layers (Weather Maps 1.0) and their default
// palettes. Relative humidity is only offered by the paid Weather Maps 2.0.
export const WEATHER_LAYERS: WeatherLayerInfo[] = [
  {
    value: "temp_new",
    label: "Temperatura",
    unit: "°C",
    stops: [
      { value: -40, color: "#821692" },
      { value: -30, color: "#8257DB" },
      { value: -20, color: "#208CEC" },
      { value: -10, color: "#20C4E8" },
      { value: 0, color: "#23DDDD" },
      { value: 10, color: "#C2FF28" },
      { value: 20, color: "#FFF028" },
      { value: 25, color: "#FFC228" },
      { value: 30, color: "#FC8014" },
    ],
  },
  {
    value: "wind_new",
    label: "Viento",
    unit: "m/s",
    stops: [
      { value: 1, color: "#FFFFFF00" },
      { value: 5, color: "#EECECC66" },
      { value: 15, color: "#B364BCB3" },
      { value: 25, color: "#3F213BCC" },
      { value: 50, color: "#744CACE6" },
      { value: 100, color: "#4600AFFF" },
    ],
  },
  {
    value: "clouds_new",
    label: "Nubes",
    unit: "%",
    stops: [
      { value: 0, color: "#FFFFFF00" },
      { value: 50, color: "#F7F7FF66" },
      { value: 80, color: "#E9E9DFCC" },
      { value: 100, color: "#D2D2D2FF" },
    ],
  },
  {
    value: "precipitation_new",
    label: "Lluvia",
    unit: "mm",
    stops: [
      { value: 0.1, color: "#C8969600" },
      { value: 0.5, color: "#7878BE19" },
      { value: 1, color: "#6E6ECD33" },
      { value: 10, color: "#5050E1B2" },
      { value: 140, color: "#1414FFE5" },
    ],
  },
];
