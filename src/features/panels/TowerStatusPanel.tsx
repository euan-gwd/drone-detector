import { useState, type JSX } from "react";
import { ChevronDown, Radio } from 'lucide-react';
import { useTowerStore } from "../../store/towerStore";

function TowerStatusPanel(): JSX.Element {
  const [open, setOpen] = useState(true);
  const towers = useTowerStore((state) => state.towers);
  const selectedTowerId = useTowerStore((state) => state.selectedTowerId);
  const selectTower = useTowerStore((state) => state.selectTower);
  const detectionsByTower = useTowerStore((state) => state.detectionsByTower);

  const towerList = Object.values(towers);
  const onlineTowers = towerList.filter(tower => tower.status === "online");
  const offlineTowers = towerList.filter(tower => tower.status === "offline");
  const maintenanceTowers = towerList.filter(tower => tower.status === "maintenance");
  const errorTowers = towerList.filter(tower => tower.status === "error");

  const totalDetections = Object.values(detectionsByTower).reduce(
    (sum, detections) => sum + detections.length, 0
  );

  const getTowerStatusColor = (status: string): string => {
    switch (status) {
      case "online":
        return "text-green-400";
      case "maintenance":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      case "offline":
      default:
        return "text-gray-400";
    }
  };

  const getTowerStatusDot = (status: string): string => {
    switch (status) {
      case "online":
        return "bg-green-400";
      case "maintenance":
        return "bg-yellow-400";
      case "error":
        return "bg-red-400";
      case "offline":
      default:
        return "bg-gray-400";
    }
  };

  const icon = <Radio className="h-4 w-4 text-success" />;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-600 bg-surfaceAlt shadow-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-[#1a3a22] px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-[#1f4428]"
      >
        {icon}
        <span className="flex-1">Tower Status</span>
        <ChevronDown className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 py-3">
          {/* Summary */}
          <div className="text-xs text-slate-300 mb-3">
            <div className="flex justify-between items-baseline mb-1">
              <span>Total towers:</span>
              <span className="font-medium text-slate-100">{towerList.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Online:</span>
                <span className="text-green-400">{onlineTowers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Offline:</span>
                <span className="text-gray-400">{offlineTowers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Maintenance:</span>
                <span className="text-yellow-400">{maintenanceTowers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Error:</span>
                <span className="text-red-400">{errorTowers.length}</span>
              </div>
            </div>
            {totalDetections > 0 && (
              <p className="mt-2 text-mapGlow">
                <span className="font-medium">{totalDetections}</span> active detection{totalDetections !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Tower List */}
          {towerList.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-300 border-t border-slate-600 pt-2">
                Tower List
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {towerList
                  .sort((a, b) => {
                    // Sort: online first, then by name
                    if (a.status === "online" && b.status !== "online") return -1;
                    if (b.status === "online" && a.status !== "online") return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((tower) => {
                    const isSelected = selectedTowerId === tower.id;
                    const recentDetections = detectionsByTower[tower.id] || [];
                    const activeSensors = tower.sensors.filter(s => s.status === "active").length;

                    return (
                      <button
                        key={tower.id}
                        type="button"
                        onClick={() => selectTower(tower.id)}
                        className={`w-full text-left rounded px-2 py-1.5 text-xs transition-colors ${
                          isSelected
                            ? "bg-[#1a3a22] border border-mapGlow"
                            : "hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getTowerStatusDot(tower.status)}`} />
                            <span className="font-medium text-slate-200 truncate">
                              {tower.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            {recentDetections.length > 0 && (
                              <span className="text-mapGlow font-medium">
                                {recentDetections.length}
                              </span>
                            )}
                            <span className="text-[10px]">
                              {activeSensors}/{tower.sensors.length}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-0.5 text-[10px] text-slate-500">
                          <span className={getTowerStatusColor(tower.status)}>
                            {tower.status}
                          </span>
                          <span>
                            {(tower.range / 1000).toFixed(1)}km range
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 border-t border-slate-600 pt-2">
              No towers available.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default TowerStatusPanel;