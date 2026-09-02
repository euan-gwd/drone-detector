import { useUiStore } from "../../store/uiStore";
import { MAP_STYLES, mapStyleLabels, type MapStyle } from "./protomapsStyles";
import type { JSX } from "react";

function MapStyleSwitcher(): JSX.Element {
  const mapStyle = useUiStore((state) => state.mapStyle);
  const setMapStyle = useUiStore((state) => state.setMapStyle);

  return (
    <div
      className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-slate-600 bg-surfaceAlt/90 px-3 py-2 shadow-panel backdrop-blur-sm"
      aria-label="Map style switcher"
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Map</span>
      <div className="flex items-center gap-1">
        {MAP_STYLES.map((style: MapStyle) => (
          <button
            key={style}
            type="button"
            onClick={() => setMapStyle(style)}
            aria-pressed={mapStyle === style}
            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-mapGlow ${
              mapStyle === style
                ? "bg-green-400 text-slate-900"
                : "bg-slate-700/60 text-slate-200 hover:bg-slate-600/80"
            }`}
          >
            {mapStyleLabels[style]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MapStyleSwitcher;