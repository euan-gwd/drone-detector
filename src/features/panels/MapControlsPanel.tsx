import { Activity, useState, type JSX } from "react";
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useUiStore } from "../../store/uiStore";

function MapControlsPanel(): JSX.Element {
  const [open, setOpen] = useState(false); // Default closed to save space
  const showRangeMarkers = useUiStore((state) => state.showRangeMarkers);
  const showCameraArcs = useUiStore((state) => state.showCameraArcs);
  const setShowRangeMarkers = useUiStore((state) => state.setShowRangeMarkers);
  const setShowCameraArcs = useUiStore((state) => state.setShowCameraArcs);

  const icon = <Eye className="h-4 w-4 text-success" />;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-600 bg-surfaceAlt shadow-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-[#1a3a22] px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-[#1f4428]"
      >
        {icon}
        <span className="flex-1">Map Controls</span>
        <ChevronDown className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <Activity mode={open ? "visible" : "hidden"}>
        <div className="px-4 py-3">
          <div className="space-y-3">
            {/* Range Markers Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showRangeMarkers ? (
                  <Eye className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                )}
                <div>
                  <p className="text-xs font-medium text-slate-200">Range Markers</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Show tower detection ranges (1-5km circles)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRangeMarkers(!showRangeMarkers)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-mapGlow ${
                  showRangeMarkers ? "bg-green-400" : "bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    showRangeMarkers ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Camera Arcs Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showCameraArcs ? (
                  <Eye className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                )}
                <div>
                  <p className="text-xs font-medium text-slate-200">Camera Arcs</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Show tower camera coverage sectors
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCameraArcs(!showCameraArcs)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-mapGlow ${
                  showCameraArcs ? "bg-green-400" : "bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    showCameraArcs ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Future controls can be added here */}
            <div className="border-t border-slate-600 pt-2">
              <p className="text-[10px] text-slate-500 italic">
                Additional map visualization controls will be added here
              </p>
            </div>
          </div>
        </div>
      </Activity>
    </section>
  );
}

export default MapControlsPanel;