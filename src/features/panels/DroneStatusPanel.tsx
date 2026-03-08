import { useState, type JSX } from "react";
import { ChevronDown, Zap } from 'lucide-react';
import { useDroneStore } from "../../store/droneStore";

function DroneStatusPanel(): JSX.Element {
  const [open, setOpen] = useState(true);
  const drones = useDroneStore((state) => state.drones);

  // React Compiler automatically memoises this — no useMemo() needed.
  const activeDroneCount = Object.values(drones).filter((d) => d.status !== "offline").length;

  const icon = <Zap className="h-4 w-4 text-success" />;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-600 bg-surfaceAlt shadow-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-[#1a3a22] px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-[#1f4428]"
      >
        {icon}
        <span className="flex-1">Drone Status</span>
        <ChevronDown className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 py-3">
            <div className="text-xs text-slate-300">
              <p><span className="font-medium text-slate-100">{activeDroneCount}</span> active drone{activeDroneCount !== 1 ? "s" : ""} tracked.</p>
              <p className="mt-1 text-slate-400">Select a drone on the map to inspect its details.</p>
            </div>
        </div>
      )}
    </section>
  );
}

export default DroneStatusPanel;
