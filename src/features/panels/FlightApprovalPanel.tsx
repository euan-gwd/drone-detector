import { useFlightStore } from "../../store/flightStore";

function FlightApprovalPanel(): JSX.Element {
  const approvals = useFlightStore((state) => state.approvals);
  const busyAction = useFlightStore((state) => state.busyAction);
  const runAction = useFlightStore((state) => state.runAction);

  const current = approvals[0];

  if (!current) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-600 bg-surfaceAlt p-4 shadow-panel">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Flight Plan Approval</h2>
        <span className="rounded bg-success/20 px-2 py-1 text-[11px] uppercase text-success">
          {current.status}
        </span>
      </header>
      <div className="space-y-1 text-xs text-slate-300">
        <p>Flight Plan: {current.id}</p>
        <p>Aircraft: {current.aircraftId}</p>
        <p>Started: {new Date(current.startedAt).toLocaleString()}</p>
        <p>Plan Start: {new Date(current.planStartedAt).toLocaleString()}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            void runAction("view");
          }}
          disabled={busyAction !== null}
          className="rounded border border-slate-500 px-2 py-1.5 text-slate-100 hover:border-mapGlow disabled:opacity-40"
        >
          View plan
        </button>
        <button
          type="button"
          onClick={() => {
            void runAction("end-plan");
          }}
          disabled={busyAction !== null}
          className="rounded border border-slate-500 px-2 py-1.5 text-slate-100 hover:border-mapGlow disabled:opacity-40"
        >
          End plan
        </button>
        <button
          type="button"
          onClick={() => {
            void runAction("land");
          }}
          disabled={busyAction !== null}
          className="rounded bg-mapGlow px-2 py-1.5 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
        >
          Land
        </button>
        <button
          type="button"
          onClick={() => {
            void runAction("end-flight");
          }}
          disabled={busyAction !== null}
          className="rounded border border-slate-500 px-2 py-1.5 text-slate-100 hover:border-mapGlow disabled:opacity-40"
        >
          End flight
        </button>
      </div>
    </section>
  );
}

export default FlightApprovalPanel;
