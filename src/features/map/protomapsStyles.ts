export const MAP_STYLES = ["dark", "light", "white", "grayscale", "black"] as const;

export type MapStyle = (typeof MAP_STYLES)[number];

const MAP_STYLE_LABELS: Record<MapStyle, string> = {
  dark: "Dark",
  light: "Light",
  white: "White",
  grayscale: "Gray",
  black: "Black",
};

export const mapStyleLabels = MAP_STYLE_LABELS;

export function protomapsStyleUrl(theme: MapStyle): string {
  return `https://api.protomaps.com/styles/v5/${theme}/en.json?key=${import.meta.env.VITE_PROTOMAPS_API_KEY}`;
}