import { useState, type JSX } from "react";
import type { ReactNode } from "react";
import { BadgeCheck, ChevronDown, Send } from "lucide-react";
import { useDroneStore } from "../../store/droneStore";
import { useFlightStore } from "../../store/flightStore";
import type { FlightApproval } from "../../types/drone";
import { flightApprovalStatusColor } from "../../utils/statusColors";

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
      <ChevronDown className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function FlightApprovalPanel(): JSX.Element {
  const [planOpen, setPlanOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);

  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const approvals = useFlightStore((state) => state.approvals);

  const selectedDrone = selectedDroneId ? drones[selectedDroneId] ?? null : null;
  // React Compiler automatically memoises this — no useMemo() needed.
  const matchedApproval = selectedDroneId
    ? (approvals.find((a) => a.aircraftId === selectedDroneId) ?? null)
    : null;

  const current =
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

  // ── Derived state: encodes the full flight state machine for the UI ────────
  // These booleans are the single source of truth for what buttons are enabled
  // or visible. Nothing in the JSX below makes its own eligibility decisions.
  const isApproved = current?.status === "approved";

  const isReadyOnGround =
    selectedDrone?.status === "offline" &&
    (current?.status === "approved" || current?.status === "pending" || current?.status === "actionrequired");

  const flightStatus = !selectedDrone ? "—" : isReadyOnGround ? "Ready" : selectedDrone.status === "offline" ? "Landed" : "In flight";
  const hasStarted = isApproved && selectedDrone?.status !== "offline";

  const checkIcon = <BadgeCheck className="h-4 w-4 text-success" />;

  const droneIcon = <Send className="h-4 w-4 text-success" />;

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
                    <Row label="Status:" value={<span className={flightApprovalStatusColor(plan.status)}>{plan.status}</span>} />
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
                  value={<span className={flightApprovalStatusColor(current.status)}>{current.status.charAt(0).toUpperCase() + current.status.slice(1)}</span>}
                />
                <Row label="Flight Status:" value={flightStatus} />
                <Row label="Flight Started:" value={hasStarted ? new Date(current.startedAt).toLocaleString() : "Not started"} />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-300">Comments from the authority</p>
              <p className="mt-0.5 text-xs text-slate-400">{current.comments}</p>
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
