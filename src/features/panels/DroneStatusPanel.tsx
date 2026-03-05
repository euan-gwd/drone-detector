import { useMemo } from "react";
import { useDroneStore } from "../../store/droneStore";

function DroneStatusPanel(): JSX.Element {
  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);

  const selected = useMemo(() => {
    if (!selectedDroneId) {
      return null;
    }
    return drones[selectedDroneId] ?? null;
  }, [drones, selectedDroneId]);

  const activeCount = Object.values(drones).length;

  return (
    <section className="rounded-lg border border-slate-600 bg-surfaceAlt p-4 shadow-panel">
      <h2 className="mb-3 text-sm font-semibold text-slate-100">Drone Status</h2>
      <p className="text-xs text-slate-300">Active drones: {activeCount}</p>
      {selected ? (
        <div className="mt-3 space-y-1 text-xs text-slate-200">
          <p className="font-medium text-mapGlow">{selected.name}</p>
          <p>ID: {selected.id}</p>
          <p>Speed: {selected.speedMps} m/s</p>
          <p>Altitude: {selected.altitudeM} m</p>
          <p>Status: {selected.status}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">Select a marker on the map to inspect details.</p>
      )}
    </section>
  );
}

export default DroneStatusPanel;
