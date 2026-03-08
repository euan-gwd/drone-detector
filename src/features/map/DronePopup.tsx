import type { JSX } from "react";
import { X } from 'lucide-react';
import type { Drone, FlightApproval } from "../../types/drone";
import { droneStatusColor } from "../../utils/statusColors";

interface DronePopupProps {
  drone: Drone;
  approvalStatus?: FlightApproval["status"];
  /** Called when the user clicks the X button to dismiss the popup */
  onClose: () => void;
}

/**
 * Presentational popup rendered inside an OpenLayers overlay.
 * Receives all data via props; map and store wiring lives in MapContainer.
 */
function DronePopup({ drone, approvalStatus, onClose }: DronePopupProps): JSX.Element {
  const statusLabel =
    drone.status === "offline" &&
    (approvalStatus === "approved" || approvalStatus === "pending" || approvalStatus === "actionrequired")
      ? "Ready"
      : drone.status.charAt(0).toUpperCase() + drone.status.slice(1);

  return (
    <div className="relative">
      <div className="w-48 overflow-hidden rounded-lg border border-slate-600 bg-[#0d1b12] shadow-panel">
        <div className="flex items-center justify-between bg-[#1a3a22] px-3 py-2">
          <span className="truncate text-xs font-semibold text-mapGlow">
            {drone.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drone popup"
            className="ml-2 shrink-0 text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-0.5 px-3 py-2 text-xs">
          <TelemetryRow label="ID" value={drone.id} />
          <TelemetryRow label="Speed" value={`${drone.speedMps} m/s`} />
          <TelemetryRow label="Altitude" value={`${drone.altitudeM} m`} />
          <TelemetryRow label="Heading" value={`${drone.headingDeg}°`} />
          <div className="flex items-baseline justify-between gap-2 pt-0.5">
            <span className="text-slate-400">Status</span>
            <span className={`font-medium ${droneStatusColor(drone.status, approvalStatus)}`}>
              {statusLabel}
            </span>
          </div>
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

export default DronePopup;
