import { useState, useMemo, type JSX } from "react";
import { useDroneStore } from "../../store/droneStore";
import { droneStatusColor } from "../../utils/statusColors";

function DroneStatusPanel(): JSX.Element {
  const [open, setOpen] = useState(true);
  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);

  const selected = useMemo(() => {
    if (!selectedDroneId) return null;
    return drones[selectedDroneId] ?? null;
  }, [drones, selectedDroneId]);

  const activeDroneCount = useMemo(
    () => Object.values(drones).filter((d) => d.status !== "offline").length,
    [drones]
  );

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-success">
      <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
    </svg>
  );

  return (
    <section className="overflow-hidden rounded-lg border border-slate-600 bg-surfaceAlt shadow-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-[#1a3a22] px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-[#1f4428]"
      >
        {icon}
        <span className="flex-1">Drone Status</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3">
          {selected ? (
            <div className="space-y-1 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-300">Name</span>
                <span className="font-medium text-mapGlow">{selected.name}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-300">ID</span>
                <span className="text-slate-200">{selected.id}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-300">Speed</span>
                <span className="text-slate-200">{selected.speedMps} m/s</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-300">Altitude</span>
                <span className="text-slate-200">{selected.altitudeM} m</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-300">Heading</span>
                <span className="text-slate-200">{selected.headingDeg}°</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-300">Status</span>
                <span className={droneStatusColor(selected.status)}>
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-300">
              <p><span className="font-medium text-slate-100">{activeDroneCount}</span> active drone{activeDroneCount !== 1 ? "s" : ""} tracked.</p>
              <p className="mt-1 text-slate-400">Select a drone on the map to inspect its details.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default DroneStatusPanel;
