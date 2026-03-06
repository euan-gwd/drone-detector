import { useState, useMemo, useOptimistic, type JSX } from "react";
import type { ReactNode } from "react";
import { useDroneStore } from "../../store/droneStore";
import { useFlightStore } from "../../store/flightStore";
import type { FlightApproval } from "../../types/drone";

function statusColor(status: string): string {
  if (status === "approved") return "text-success";
  if (status === "pending") return "text-amber-300";
  if (status === "actionrequired") return "text-rose-300";
  return "text-slate-400";
}

function Row({ label, value }: { label: string; value: ReactNode }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5 text-xs">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="text-right text-slate-200">{value}</span>
    </div>
  );
}

function SectionHeader({
  title,
  open,
  onToggle,
  icon
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  icon: ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 bg-[#1a3a22] px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-[#1f4428]"
    >
      {icon}
      <span className="flex-1">{title}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      >
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

function FlightApprovalPanel(): JSX.Element {
  const [planOpen, setPlanOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);

  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const approvals = useFlightStore((state) => state.approvals);
  const busyAction = useFlightStore((state) => state.busyAction);
  const runAction = useFlightStore((state) => state.runAction);

  const selectedDrone = selectedDroneId ? drones[selectedDroneId] ?? null : null;
  const matchedApproval = useMemo(() => {
    if (!selectedDroneId) return null;
    return approvals.find((a) => a.aircraftId === selectedDroneId) ?? null;
  }, [approvals, selectedDroneId]);

  const [optimisticApproval, setOptimisticApproval] = useOptimistic(
    matchedApproval,
    (state, update: Partial<FlightApproval>) => (state ? { ...state, ...update } : null)
  );

  const current =
    optimisticApproval ??
    matchedApproval ??
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

  const isBusy = busyAction !== null;
  const actionsDisabled = isBusy || !selectedDroneId;
  const isApproved = current?.status === "approved";
  const needsApproval = current?.status === "pending" || current?.status === "actionrequired";
  const isAirborne = selectedDrone !== null && selectedDrone.status !== "offline";
  const canLand = isApproved && isAirborne;
  const canTakeoff = isApproved && selectedDrone !== null && !isAirborne;
  const canEndPlan = !!matchedApproval && selectedDrone !== null && !isAirborne;
  const canEndFlight = !!selectedDroneId && !isAirborne;

  const flightStatus = selectedDrone?.status === "offline" ? "Landed" : selectedDrone ? "In flight" : "—";
  const hasStarted = isApproved && selectedDrone?.status !== "offline";

  const checkIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-success">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );

  const droneIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-success">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );

  return (
    <section className="overflow-hidden rounded-lg border border-slate-600 bg-surfaceAlt shadow-panel">
      {/* ── Flight Plan Approvals ── */}
      <SectionHeader title="Flight Plan Approvals" open={planOpen} onToggle={() => setPlanOpen((v) => !v)} icon={checkIcon} />
      {planOpen && (
        <div className="border-b border-slate-700 px-4 py-3">
          {approvals.length > 0 ? (
            <div className="max-h-[15rem] overflow-y-auto space-y-3 pr-1">
              {approvals.map((plan) => {
                const planEndTime = new Date(new Date(plan.planStartedAt).getTime() + 60 * 60 * 1000);
                return (
                  <div key={plan.id} className="rounded border border-slate-700 bg-slate-800/40 px-3 py-2 space-y-1">
                    <Row label="Flight Plan:" value={plan.id} />
                    <Row label="Aircraft:" value={plan.aircraftId} />
                    <Row label="Status:" value={<span className={statusColor(plan.status)}>{plan.status}</span>} />
                    <Row label="Plan Start:" value={new Date(plan.planStartedAt).toLocaleString()} />
                    <Row label="Plan End:" value={planEndTime.toLocaleString()} />
                    {plan.comments && (
                      <>
                        <p className="pt-1 text-xs font-semibold text-slate-300">Comments from the authority</p>
                        <p className="mt-0.5 text-xs text-slate-400 italic">{plan.comments}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active flight plans.</p>
          )}
        </div>
      )}

      {/* ── Flight Approval(s) ── */}
      <SectionHeader title="Flight Approval(s)" open={approvalOpen} onToggle={() => setApprovalOpen((v) => !v)} icon={droneIcon} />
      {approvalOpen && (
        <div className="px-4 py-3">
          {current ? (
            <>
              <div className="space-y-1">
                <Row label="Aircraft is:" value={current.aircraftId} />
                <Row
                  label="Flight Approval Status:"
                  value={<span className={statusColor(current.status)}>{current.status.charAt(0).toUpperCase() + current.status.slice(1)}</span>}
                />
                <Row label="Flight Status:" value={flightStatus} />
                <Row label="Flight Started:" value={hasStarted ? new Date(current.startedAt).toLocaleString() : "Not started"} />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-300">Comments from the authority</p>
              <p className="mt-0.5 text-xs text-slate-400">{current.comments}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {/* Button 1: context-sensitive primary action */}
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedDroneId) return;
                    if (needsApproval) {
                      setOptimisticApproval({ status: "approved" });
                      void runAction(selectedDroneId, "request-approval");
                    } else if (canTakeoff) {
                      void runAction(selectedDroneId, "takeoff");
                    } else if (canLand) {
                      void runAction(selectedDroneId, "land");
                    }
                  }}
                  disabled={actionsDisabled || (!needsApproval && !canTakeoff && !canLand)}
                  className={`rounded px-2 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                    needsApproval || canTakeoff || canLand
                      ? "bg-mapGlow text-slate-950 hover:bg-cyan-300"
                      : "border border-slate-500 text-slate-100 hover:border-mapGlow"
                  }`}
                >
                  {needsApproval ? "Request Approval" : canLand ? "Land" : "Take Off"}
                </button>
                {/* Button 2: End Flight — always shown, disabled when airborne */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDroneId) void runAction(selectedDroneId, "end-plan");
                  }}
                  disabled={actionsDisabled || !canEndFlight}
                  className="rounded border border-slate-500 px-2 py-1.5 text-xs text-slate-100 hover:border-mapGlow disabled:opacity-40"
                >
                  End Flight
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Select a drone on the map to inspect its details.</p>
          )}
        </div>
      )}
    </section>
  );
}

export default FlightApprovalPanel;
