import { useMemo, useOptimistic } from "react";
import { useDroneStore } from "../../store/droneStore";
import { useFlightStore } from "../../store/flightStore";
import type { FlightApproval } from "../../types/drone";

function badgeClass(status: string): string {
  if (status === "pending") {
    return "bg-amber-500/20 text-amber-300";
  }
  if (status === "actionrequired") {
    return "bg-rose-500/20 text-rose-300";
  }
  if (status === "approved") {
    return "bg-success/20 text-success";
  }
  return "bg-slate-500/20 text-slate-200";
}

function FlightApprovalPanel(): JSX.Element {
  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const approvals = useFlightStore((state) => state.approvals);
  const busyAction = useFlightStore((state) => state.busyAction);
  const runAction = useFlightStore((state) => state.runAction);

  const selectedDrone = selectedDroneId ? drones[selectedDroneId] ?? null : null;
  const matchedApproval = useMemo(() => {
    if (!selectedDroneId) {
      return null;
    }
    return approvals.find((approval) => approval.aircraftId === selectedDroneId) ?? null;
  }, [approvals, selectedDroneId]);

  // Optimistic updates for instant feedback
  const [optimisticApproval, setOptimisticApproval] = useOptimistic(
    matchedApproval,
    (state, update: Partial<FlightApproval>) => {
      if (!state) return null;
      return { ...state, ...update };
    }
  );

  const current =
    optimisticApproval ??
    (selectedDroneId
      ? {
          id: "Not Requested",
          aircraftId: selectedDroneId,
          status: "pending" as const,
          startedAt: new Date().toISOString(),
          planStartedAt: new Date().toISOString(),
          comments: "Request approval to start operations"
        }
      : null);

  const actionsDisabled = busyAction !== null || !selectedDroneId;
  const isApproved = current?.status === "approved";
  const needsApproval = current?.status === "pending" || current?.status === "actionrequired";
  const canLand = isApproved && selectedDrone !== null && selectedDrone.status !== "offline";
  const canTakeoff = isApproved && selectedDrone !== null && selectedDrone.status === "offline";

  return (
    <section className="rounded-lg border border-slate-600 bg-surfaceAlt p-4 shadow-panel">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Flight Plan Approval</h2>
        {current ? (
          <span className={`rounded px-2 py-1 text-[11px] uppercase ${badgeClass(current.status)}`}>
            {current.status}
          </span>
        ) : null}
      </header>
      <div className="space-y-1 text-xs text-slate-300">
        <p>Selected Drone: {selectedDroneId ?? "None"}</p>
        {current ? (
          <>
            <p>Flight Plan: {current.id}</p>
            <p>Aircraft: {current.aircraftId}</p>
            <p>Started: {new Date(current.startedAt).toLocaleString()}</p>
            <p>Plan Start: {new Date(current.planStartedAt).toLocaleString()}</p>
          </>
        ) : (
          <p className="text-slate-400">No flight plan found for the selected drone.</p>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            if (selectedDroneId) {
              void runAction(selectedDroneId, "view");
            }
          }}
          disabled={actionsDisabled || !matchedApproval}
          className="rounded border border-slate-500 px-2 py-1.5 text-slate-100 hover:border-mapGlow disabled:opacity-40"
        >
          View plan
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedDroneId) {
              void runAction(selectedDroneId, "end-plan");
            }
          }}
          disabled={actionsDisabled || !matchedApproval}
          className="rounded border border-slate-500 px-2 py-1.5 text-slate-100 hover:border-mapGlow disabled:opacity-40"
        >
          End plan
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedDroneId) {
              if (needsApproval) {
                // Optimistically show approval before async action completes
                setOptimisticApproval({ status: "approved" });
              }
              void runAction(selectedDroneId, needsApproval ? "request-approval" : "land");
            }
          }}
          disabled={actionsDisabled || (!needsApproval && !canLand)}
          className="rounded bg-mapGlow px-2 py-1.5 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
        >
          {needsApproval ? "Request approval" : "Land"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedDroneId) {
              void runAction(selectedDroneId, "takeoff");
            }
          }}
          disabled={actionsDisabled || !canTakeoff}
          className="rounded border border-slate-500 px-2 py-1.5 text-slate-100 hover:border-mapGlow disabled:opacity-40"
        >
          Takeoff
        </button>
      </div>
    </section>
  );
}

export default FlightApprovalPanel;
