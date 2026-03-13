import { Activity, useState, type JSX } from "react";
import { ChevronDown, Radio } from 'lucide-react';
import { useTowerStore } from "../../store/towerStore";

function TowerStatusPanel(): JSX.Element {
  const [open, setOpen] = useState(true);
  const towers = useTowerStore((state) => state.towers);
  const selectedTowerId = useTowerStore((state) => state.selectedTowerId);
  const selectTower = useTowerStore((state) => state.selectTower);

  const towerList = Object.values(towers);
  const selectedTower = selectedTowerId ? towers[selectedTowerId] ?? null : null;
  const selectedActiveCameras = selectedTower
    ? selectedTower.cameras.filter((camera) => camera.status === "active").length
    : 0;
  const selectedActiveSensors = selectedTower
    ? selectedTower.sensors.filter((sensor) => sensor.status === "active").length
    : 0;
  const onlineTowers = towerList.filter(tower => tower.status === "online");
  const offlineTowers = towerList.filter(tower => tower.status === "offline");
  const maintenanceTowers = towerList.filter(tower => tower.status === "maintenance");
  const errorTowers = towerList.filter(tower => tower.status === "error");

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
        return "text-gray-300";
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
      <Activity mode={open ? "visible" : "hidden"}>
        <div className="px-4 py-3">
          {/* Summary */}
          <div className="text-xs text-slate-300 mb-3">
            <div className="flex justify-between items-baseline mb-1">
              <span>Total towers:</span>
              <span className="font-medium text-slate-100">{towerList.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span>Online:</span>
                <span className="text-green-400">{onlineTowers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Offline:</span>
                <span className="text-gray-300">{offlineTowers.length}</span>
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
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getTowerStatusDot(tower.status)}`} />
                            <span className="font-medium text-slate-200 truncate">
                              {tower.name}
                            </span>
                          </div>
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] capitalize ${getTowerStatusColor(tower.status)} bg-slate-800/60`}>
                            {tower.status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>

              <p className="text-xs font-medium text-slate-300 border-t border-slate-600 pt-2 mt-2">
                Tower Details
              </p>
              {selectedTower ? (
                <div className="rounded border border-slate-700 bg-slate-800/30 px-3 py-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200">Tower:</span>
                    <span className="text-slate-200">{selectedTower.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200">Status:</span>
                    <span className={`capitalize ${getTowerStatusColor(selectedTower.status)}`}>{selectedTower.status}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-slate-300">
                      <p>Cameras:</p>
                      <p>{selectedActiveCameras}/{selectedTower.cameras.length} online</p>
                    </div>
                    <div className="space-y-1">
                      {selectedTower.cameras.map((camera) => {
                        const cameraOnline = camera.status === "active";
                        return (
                          <div key={camera.id} className="flex items-center justify-between gap-2">
                            <span className="text-slate-300">{camera.name}</span>
                            <span className={cameraOnline ? "text-green-300" : "text-slate-300"}>
                              {cameraOnline ? "online" : "offline"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-2 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-slate-300">
                      <p>Sensors:</p>
                      <p>{selectedActiveSensors}/{selectedTower.sensors.length} online</p>
                    </div>
                    <div className="space-y-1">
                      {selectedTower.sensors.map((sensor) => {
                        const sensorOnline = sensor.status === "active";
                        return (
                          <div key={sensor.id} className="flex items-center justify-between gap-2">
                            <span className="text-slate-300 capitalize">{sensor.type}</span>
                            <span className={sensorOnline ? "text-green-300" : "text-slate-300"}>
                              {sensorOnline ? "online" : "offline"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-300">Select a tower from the list to inspect tower details.</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-300 border-t border-slate-600 pt-2">
              No towers available.
            </p>
          )}
        </div>
      </Activity>
    </section>
  );
}

export default TowerStatusPanel;