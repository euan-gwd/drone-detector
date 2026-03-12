import type { JSX } from 'react';
import { useUiStore } from "../../store/uiStore";
import DroneStatusPanel from "../panels/DroneStatusPanel";
import TowerStatusPanel from "../panels/TowerStatusPanel";
import MapControlsPanel from "../panels/MapControlsPanel";
import FlightApprovalPanel from "../panels/FlightApprovalPanel";
import NotificationPanel from "../panels/NotificationPanel";

function RightRail(): JSX.Element {
  const connected = useUiStore((state) => state.connected);

  return (
    <aside className="flex h-[48vh] w-full flex-col bg-surface/85 backdrop-blur-md lg:h-full lg:w-[320px] lg:max-w-[320px]">
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <div className="rounded-lg border border-slate-600 bg-surfaceAlt px-3 py-2 text-xs text-slate-200">
          System Status:{" "}
          <span className={connected ? "text-success" : "text-danger"}>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <DroneStatusPanel />
        <TowerStatusPanel />
        <MapControlsPanel />
        <FlightApprovalPanel />
        <NotificationPanel />
      </div>
    </aside>
  );
}

export default RightRail;
