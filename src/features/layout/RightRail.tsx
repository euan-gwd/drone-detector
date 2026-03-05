import type { JSX } from 'react';
import { useUiStore } from "../../store/uiStore";
import DroneStatusPanel from "../panels/DroneStatusPanel";
import FlightApprovalPanel from "../panels/FlightApprovalPanel";
import NotificationPanel from "../panels/NotificationPanel";

function RightRail(): JSX.Element {
  const connected = useUiStore((state) => state.connected);

  return (
    <aside className="h-[48vh] w-full space-y-4 overflow-auto bg-surface/85 p-4 backdrop-blur-md lg:h-full lg:w-[320px] lg:max-w-[320px]">
      <div className="rounded-lg border border-slate-600 bg-surfaceAlt px-3 py-2 text-xs text-slate-200">
        WebSocket: {" "}
        <span className={connected ? "text-success" : "text-danger"}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <FlightApprovalPanel />
      <DroneStatusPanel />
      <NotificationPanel />
    </aside>
  );
}

export default RightRail;
