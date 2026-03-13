import { useState, type JSX } from "react";
import { ChevronDown, Zap } from 'lucide-react';
import { useDroneStore } from "../../store/droneStore";
import { useFlightStore } from "../../store/flightStore";
import type { Drone, FlightApproval } from "../../types/drone";
import { flightApprovalStatusColor } from "../../utils/statusColors";

function DroneStatusPanel(): JSX.Element {
  const [open, setOpen] = useState(true);
  const [optimisticStatusByDrone, setOptimisticStatusByDrone] = useState<Record<string, FlightApproval["status"]>>({});
  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const selectDrone = useDroneStore((state) => state.selectDrone);
  const approvals = useFlightStore((state) => state.approvals);
  const busyAction = useFlightStore((state) => state.busyAction);
  const runAction = useFlightStore((state) => state.runAction);

  const isBusy = busyAction !== null;
  const selectedDrone = selectedDroneId ? drones[selectedDroneId] ?? null : null;

  // React Compiler automatically memoises this — no useMemo() needed.
  const droneList = Object.values(drones);
  const onlineDrones = droneList.filter((d) => d.status === "online");
  const warningDrones = droneList.filter((d) => d.status === "warning");
  const offlineDrones = droneList.filter((d) => d.status === "offline");

  const getDroneStatusColor = (status: Drone["status"]): string => {
    switch (status) {
      case "online":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "offline":
      default:
        return "text-gray-400";
    }
  };

  const getDroneStatusDot = (status: Drone["status"]): string => {
    switch (status) {
      case "online":
        return "bg-green-400";
      case "warning":
        return "bg-yellow-400";
      case "offline":
      default:
        return "bg-gray-400";
    }
  };

  const getApprovalForDrone = (droneId: string): FlightApproval => {
    const matched = approvals.find((a) => a.aircraftId === droneId);
    const optimisticStatus = optimisticStatusByDrone[droneId];

    if (matched) {
      return optimisticStatus ? { ...matched, status: optimisticStatus } : matched;
    }

    return {
      id: "Not Requested",
      aircraftId: droneId,
      status: optimisticStatus ?? "pending",
      startedAt: new Date().toISOString(),
      planStartedAt: new Date().toISOString(),
      comments: "Request approval to start operations"
    };
  };

  const icon = <Zap className="h-4 w-4 text-success" />;

  const selectedApproval = selectedDroneId ? getApprovalForDrone(selectedDroneId) : null;
  const selectedIsApproved = selectedApproval?.status === "approved";
  const selectedNeedsApproval =
    selectedApproval?.status === "pending" ||
    selectedApproval?.status === "actionrequired" ||
    selectedApproval?.status === "rejected";
  const selectedIsAirborne = selectedDrone !== null && selectedDrone.status !== "offline";
  const selectedCanLand = !!selectedIsApproved && selectedIsAirborne;
  const selectedCanTakeoff = !!selectedIsApproved && selectedDrone !== null && !selectedIsAirborne;
  const selectedCanEndFlight = !!selectedDrone && !selectedIsAirborne;
  const selectedIsReadyOnGround =
    selectedDrone?.status === "offline" &&
    (selectedApproval?.status === "approved" ||
      selectedApproval?.status === "pending" ||
      selectedApproval?.status === "actionrequired");
  const selectedFlightStatus = !selectedDrone
    ? "-"
    : selectedIsReadyOnGround
      ? "Ready"
      : selectedDrone.status === "offline"
        ? "Landed"
        : "In flight";

  return (
    <section className="overflow-hidden rounded-lg border border-slate-600 bg-surfaceAlt shadow-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-[#1a3a22] px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-[#1f4428]"
      >
        {icon}
        <span className="flex-1">Drone Status</span>
        <ChevronDown className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 py-3">
          <div className="text-xs text-slate-300 mb-3">
            <div className="flex justify-between items-baseline mb-1">
              <span>Total drones:</span>
              <span className="font-medium text-slate-100">{droneList.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Online:</span>
                <span className="text-green-400">{onlineDrones.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Warning:</span>
                <span className="text-yellow-400">{warningDrones.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Offline:</span>
                <span className="text-gray-400">{offlineDrones.length}</span>
              </div>
            </div>
          </div>

          {droneList.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-300 border-t border-slate-600 pt-2">
                Drone List
              </p>
              <div className="max-h-56 overflow-y-auto space-y-1">
                {droneList
                  .sort((a, b) => {
                    if (a.status === "online" && b.status !== "online") return -1;
                    if (b.status === "online" && a.status !== "online") return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((drone) => {
                    const isSelected = selectedDroneId === drone.id;
                    const approval = getApprovalForDrone(drone.id);

                    return (
                      <button
                        key={drone.id}
                        type="button"
                        onClick={() => selectDrone(drone.id)}
                        className={`rounded px-2 py-1.5 text-xs transition-colors ${
                          isSelected
                            ? "w-full text-left bg-[#1a3a22] border border-mapGlow"
                            : "w-full text-left border border-transparent hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full ${getDroneStatusDot(drone.status)}`} />
                            <span className="font-medium text-slate-200 truncate">{drone.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{drone.id}</span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5 text-[10px]">
                          <span className={getDroneStatusColor(drone.status)}>{drone.status}</span>
                          <span className={flightApprovalStatusColor(approval.status)}>
                            {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>

              <p className="text-xs font-medium text-slate-300 border-t border-slate-600 pt-2 mt-2">
                Flight Controls
              </p>
              {selectedDrone && selectedApproval ? (
                <div className="rounded border border-slate-700 bg-slate-800/30 px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Aircraft:</span>
                    <span className="text-slate-200">{selectedDrone.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Approval:</span>
                    <span className={flightApprovalStatusColor(selectedApproval.status)}>
                      {selectedApproval.status.charAt(0).toUpperCase() + selectedApproval.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Flight Status:</span>
                    <span className="text-slate-200">{selectedFlightStatus}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedDroneId) return;
                        if (selectedNeedsApproval) {
                          setOptimisticStatusByDrone((prev) => ({ ...prev, [selectedDroneId]: "approved" }));
                          void runAction(selectedDroneId, "request-approval");
                        } else if (selectedCanTakeoff) {
                          void runAction(selectedDroneId, "takeoff");
                        } else if (selectedCanLand) {
                          void runAction(selectedDroneId, "land");
                        }
                      }}
                      disabled={isBusy || (!selectedNeedsApproval && !selectedCanTakeoff && !selectedCanLand)}
                      className={`rounded px-2 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                        selectedNeedsApproval || selectedCanTakeoff || selectedCanLand
                          ? "bg-mapGlow text-slate-950 hover:bg-cyan-300"
                          : "border border-slate-500 text-slate-100 hover:border-mapGlow"
                      }`}
                    >
                      {selectedNeedsApproval ? "Request Approval" : selectedCanLand ? "Land" : "Take Off"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDroneId) void runAction(selectedDroneId, "end-plan");
                      }}
                      disabled={isBusy || !selectedCanEndFlight}
                      className="rounded border border-slate-500 px-2 py-1.5 text-xs text-slate-100 hover:border-mapGlow disabled:opacity-40"
                    >
                      End Flight
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select a drone on the map or from the list to use flight controls.</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 border-t border-slate-600 pt-2">No drones available.</p>
          )}
        </div>
      )}
    </section>
  );
}

export default DroneStatusPanel;
