import type { JSX } from "react";
import { X } from 'lucide-react';
import type { SensorTower } from "../../types/sensorTower";
import { useTowerStore } from "../../store/towerStore";

interface TowerPopupProps {
  tower: SensorTower;
  /** Called when the user clicks the X button to dismiss the popup */
  onClose: () => void;
}

/**
 * Presentational popup rendered inside an OpenLayers overlay.
 * Receives tower data via props; map and store wiring lives in MapContainer.
 */
function TowerPopup({ tower, onClose }: TowerPopupProps): JSX.Element {
  const detectionsByTower = useTowerStore((state) => state.detectionsByTower);
  const cameraStates = useTowerStore((state) => state.cameraStatesByTower[tower.id]) || tower.cameras;

  const recentDetections = detectionsByTower[tower.id] || [];
  const activeSensors = tower.sensors.filter(sensor => sensor.status === "active").length;
  const activeCameras = cameraStates.filter(camera => camera.status === "active").length;

  const statusColor = tower.status === "online" ? "text-green-400" :
                      tower.status === "maintenance" ? "text-yellow-400" :
                      tower.status === "error" ? "text-red-400" : "text-gray-400";

  const avgSignalStrength = tower.sensors.length > 0
    ? (tower.sensors.reduce((sum, sensor) => sum + sensor.signalStrength, 0) / tower.sensors.length)
    : 0;

  return (
    <div className="relative">
      <div className="w-56 overflow-hidden rounded-lg border border-slate-600 bg-[#0d1b12] shadow-panel">
        <div className="flex items-center justify-between bg-[#1a3a22] px-3 py-2">
          <span className="truncate text-xs font-semibold text-mapGlow">
            {tower.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tower popup"
            className="ml-2 shrink-0 text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-0.5 px-3 py-2 text-xs">
          <TelemetryRow label="ID" value={tower.id} />
          <TelemetryRow label="Range" value={`${(tower.range / 1000).toFixed(1)} km`} />
          <TelemetryRow label="Altitude" value={`${tower.altitudeM} m`} />

          <div className="flex items-baseline justify-between gap-2 pt-0.5">
            <span className="text-slate-400">Status</span>
            <span className={`font-medium ${statusColor} capitalize`}>
              {tower.status}
            </span>
          </div>

          <TelemetryRow
            label="Sensors"
            value={`${activeSensors}/${tower.sensors.length} active`}
          />

          <TelemetryRow
            label="Cameras"
            value={`${activeCameras}/${cameraStates.length} active`}
          />

          <TelemetryRow
            label="Signal"
            value={`${Math.round(avgSignalStrength * 100)}%`}
          />

          {recentDetections.length > 0 && (
            <>
              <div className="border-t border-slate-600 pt-1.5 mt-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-slate-400">Detections</span>
                  <span className="text-green-400 font-medium">
                    {recentDetections.length}
                  </span>
                </div>
                {recentDetections.slice(0, 2).map((detection) => (
                  <div key={detection.id} className="text-[10px] text-slate-500 mt-0.5">
                    {detection.distance.toFixed(0)}m, {Math.round(detection.confidence * 100)}% conf
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Border-based triangle pointer that visually anchors the popup to the marker. */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full"
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid #1a3a22",
        }}
      />
    </div>
  );
}

/**
 * Label/value row used by popup telemetry fields.
 */
function TelemetryRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

export default TowerPopup;