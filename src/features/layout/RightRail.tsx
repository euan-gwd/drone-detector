import type { JSX } from 'react';
import { useUiStore } from "../../store/uiStore";
import DroneStatusPanel from "../panels/DroneStatusPanel";
import FlightApprovalPanel from "../panels/FlightApprovalPanel";
import NotificationPanel from "../panels/NotificationPanel";

function RightRail(): JSX.Element {
  const connected = useUiStore((state) => state.connected);

  return (
    <aside className="flex h-[48vh] w-full flex-col bg-surface/85 backdrop-blur-md lg:h-full lg:w-[320px] lg:max-w-[320px]">
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <div className="rounded-lg border border-slate-600 bg-surfaceAlt px-3 py-2 text-xs text-slate-200">
          WebSocket:{" "}
          <span className={connected ? "text-success" : "text-danger"}>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <FlightApprovalPanel />
        <DroneStatusPanel />
        <NotificationPanel />
      </div>
      <button
        type="button"
        className="flex w-full shrink-0 items-center justify-center gap-2 bg-danger py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        Declare Emergency
      </button>
    </aside>
  );
}

export default RightRail;
