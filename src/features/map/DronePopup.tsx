import type { JSX } from "react";
import type { Drone } from "../../types/drone";
import { droneStatusColor } from "../../utils/statusColors";

interface DronePopupProps {
  drone: Drone;
  /** Called when the user clicks the X button to dismiss the popup */
  onClose: () => void;
}

/**
 * DronePopup
 *
 * A small info card rendered inside an OpenLayers Overlay so it stays
 * pinned above the drone's map marker and moves with it in real time.
 *
 * This component is intentionally "dumb" — it receives data as props
 * and has no knowledge of the map, Zustand stores, or WebSocket events.
 * All the map/OL wiring lives in MapContainer.tsx.
 *
 * Visual layout:
 *
 *   ┌──────────────────────────┐
 *   │  Drone Name          [X] │  ← header
 *   ├──────────────────────────┤
 *   │  ID       drn-101        │
 *   │  Speed    7.2 m/s        │
 *   │  Altitude 42 m           │
 *   │  Heading  213°           │
 *   │  Status   Online         │
 *   └───────────┬──────────────┘
 *               ▼               ← CSS triangle pointing down at the icon
 */
function DronePopup({ drone, onClose }: DronePopupProps): JSX.Element {
  const statusLabel = drone.status.charAt(0).toUpperCase() + drone.status.slice(1);

  return (
    // Outer wrapper — position:relative so the triangle can be anchored to it
    <div className="relative">
      {/* ── Card ── */}
      <div className="w-48 overflow-hidden rounded-lg border border-slate-600 bg-[#0d1b12] shadow-panel">

        {/* Header row — drone name + close button */}
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
            {/* X icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Telemetry rows */}
        <div className="space-y-0.5 px-3 py-2 text-xs">
          <TelemetryRow label="ID" value={drone.id} />
          <TelemetryRow label="Speed" value={`${drone.speedMps} m/s`} />
          <TelemetryRow label="Altitude" value={`${drone.altitudeM} m`} />
          <TelemetryRow label="Heading" value={`${drone.headingDeg}°`} />
          {/* Status gets a colour class from the shared helper */}
          <div className="flex items-baseline justify-between gap-2 pt-0.5">
            <span className="text-slate-400">Status</span>
            <span className={`font-medium ${droneStatusColor(drone.status)}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/*
       * ── Downward-pointing triangle ──
       *
       * Pure CSS border trick: a zero-size div whose top border is coloured
       * and whose left/right borders are transparent creates a triangle.
       * It sits centred below the card and visually "connects" the popup
       * to the drone icon on the map below it.
       *
       * border-t colour matches the card's background so it looks seamless.
       */}
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

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * A single label/value row inside the telemetry section.
 * Extracted so the parent stays readable at a glance.
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
