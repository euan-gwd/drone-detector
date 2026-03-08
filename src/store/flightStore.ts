import { create } from "zustand";
import type { FlightApproval } from "../types/drone";
import { useDroneStore } from "./droneStore";
import { useNotificationStore } from "./notificationStore";

/**
 * The set of actions a user can trigger for a drone's flight lifecycle.
 *
 * | Action             | Precondition                                    | Effect                                          |
 * |--------------------|------------------------------------------------|--------------------------------------------------|
 * | "request-approval" | plan is "pending" or "actionrequired"          | Sets plan to "approved"; drone ready for takeoff |
 * | "takeoff"          | plan is "approved", drone is landed (offline)  | Sets drone control status to "online"            |
 * | "land"             | plan is "approved", drone is airborne          | Sets drone control status to "offline"           |
 * | "end-plan"         | plan is "approved", drone is landed (offline)  | Resets plan to "pending"                         |
 * | "view"             | any state                                       | Placeholder action; no flight-state transition   |
 */
type FlightAction = "view" | "request-approval" | "end-plan" | "land" | "takeoff";

interface FlightStore {
  approvals: FlightApproval[];
  /**
   * The action string that is currently being processed, or `null` when idle.
    * Set at the start of `runAction` and cleared when the action resolves so the
    * UI can disable controls while a command is in-flight.
   */
  busyAction: string | null;
  seedApprovals: (items: FlightApproval[]) => void;
  runAction: (droneId: string, action: FlightAction) => Promise<void>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const upsertApproval = (
  approvals: FlightApproval[],
  droneId: string,
  update: (current: FlightApproval | null) => FlightApproval
): FlightApproval[] => {
  const index = approvals.findIndex((item) => item.aircraftId === droneId);
  const current = index >= 0 ? approvals[index] : null;
  const next = update(current);

  if (index >= 0) {
    return approvals.map((item, itemIndex) => (itemIndex === index ? next : item));
  }

  return [next, ...approvals];
};

const INITIAL_APPROVALS: FlightApproval[] = [
  {
    id: "860404",
    aircraftId: "drn-102",
    status: "approved",
    startedAt: new Date().toISOString(),
    planStartedAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    comments: "None"
  },
  {
    id: "860405",
    aircraftId: "drn-304",
    status: "approved",
    startedAt: new Date().toISOString(),
    planStartedAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    comments: "Low altitude corridor"
  },
  {
    id: "860406",
    aircraftId: "drn-401",
    status: "pending",
    startedAt: new Date().toISOString(),
    planStartedAt: new Date(Date.now() + 1000 * 60 * 50).toISOString(),
    comments: "Awaiting tower acknowledgment"
  }
];

export const useFlightStore = create<FlightStore>((set, get) => {
  // Initialize pending drones as offline.
  INITIAL_APPROVALS.forEach((item) => {
    if (item.status === "pending") {
      const { setControlStatus, updateDroneStatus } = useDroneStore.getState();
      setControlStatus(item.aircraftId, "offline");
      updateDroneStatus(item.aircraftId, "offline");
    }
  });

  return {
    approvals: INITIAL_APPROVALS,
    busyAction: null,
    /**
     * Replaces the current approval list and forces any "pending" drones
     * offline so their map markers and status are correct from the start.
     * Call this when loading approvals from a real backend.
     */
    seedApprovals: (items) => {
      const setControlStatus = useDroneStore.getState().setControlStatus;
      const updateDroneStatus = useDroneStore.getState().updateDroneStatus;

      items.forEach((item) => {
        if (item.status === "pending") {
          setControlStatus(item.aircraftId, "offline");
          updateDroneStatus(item.aircraftId, "offline");
        }
      });

      set({ approvals: items });
    },
  runAction: async (droneId, action) => {
    set({ busyAction: action });
    // Simulate network round-trip latency (900 ms).
    await wait(900);

    // Read current state from sibling stores.
    // We use .getState() (not React hooks) because this function runs outside
    // the React render cycle — calling a hook here would violate React's rules.
    const droneState = useDroneStore.getState();
    const updateDroneStatus = droneState.updateDroneStatus;
    const setControlStatus = droneState.setControlStatus;
    const drone = droneState.drones[droneId] ?? null;
    const addNotification = useNotificationStore.getState().addNotification;
    const approval = get().approvals.find((item) => item.aircraftId === droneId);

    // request-approval: set plan to approved and emit success notification.
    if (action === "request-approval") {
      const now = new Date();
      set((state) => ({
        approvals: upsertApproval(state.approvals, droneId, (current) => ({
          id: current?.id ?? String(Math.floor(100000 + Math.random() * 899999)),
          aircraftId: droneId,
          status: "approved",
          startedAt: now.toISOString(),
          planStartedAt: new Date(now.getTime() + 1000 * 60 * 5).toISOString(),
          comments: "Approved by mock workflow"
        }))
      }));

      addNotification({
        id: `action-${crypto.randomUUID()}`,
        level: "success",
        title: "Flight plan approved",
        droneName: drone?.name,
        droneId: droneId,
        message: "approved and ready for takeoff.",
        createdAt: new Date().toISOString()
      });

      set({ busyAction: null });
      return;
    }

    // Ensure a plan record exists before action-specific guard checks.
    if (!approval) {
      set((state) => ({
        approvals: upsertApproval(state.approvals, droneId, () => ({
          id: String(Math.floor(100000 + Math.random() * 899999)),
          aircraftId: droneId,
          status: "pending",
          startedAt: new Date().toISOString(),
          planStartedAt: new Date().toISOString(),
          comments: "Approval request required"
        }))
      }));
      setControlStatus(droneId, "offline");
      updateDroneStatus(droneId, "offline");
    }

    // Guard: takeoff and land require an approved plan.
    if ((action === "takeoff" || action === "land") && approval?.status !== "approved") {
      set((state) => ({
        approvals: upsertApproval(state.approvals, droneId, (current) => ({
          id: current?.id ?? String(Math.floor(100000 + Math.random() * 899999)),
          aircraftId: droneId,
          status: "actionrequired",
          startedAt: current?.startedAt ?? new Date().toISOString(),
          planStartedAt: current?.planStartedAt ?? new Date().toISOString(),
          comments: "Takeoff and landing require an approved plan"
        }))
      }));

      addNotification({
        id: `action-${crypto.randomUUID()}`,
        level: "warning",
        title: "Action blocked",
        droneName: drone?.name,
        droneId: droneId,
        message: "needs an approved flight plan before takeoff or landing.",
        createdAt: new Date().toISOString()
      });
      set({ busyAction: null });
      return;
    }

    // land: force offline control status.
    if (action === "land") {
      setControlStatus(droneId, "offline");
      updateDroneStatus(droneId, "offline");
    }

    // takeoff: set control status to online.
    if (action === "takeoff") {
      setControlStatus(droneId, "online");
      updateDroneStatus(droneId, "online");
    }

    // end-plan: reset plan to pending and ensure drone is landed.
    if (action === "end-plan") {
      if (approval?.status !== "approved") {
        set((state) => ({
          approvals: upsertApproval(state.approvals, droneId, (current) => ({
            id: current?.id ?? String(Math.floor(100000 + Math.random() * 899999)),
            aircraftId: droneId,
            status: "actionrequired",
            startedAt: current?.startedAt ?? new Date().toISOString(),
            planStartedAt: current?.planStartedAt ?? new Date().toISOString(),
            comments: "No approved plan to end"
          }))
        }));

        addNotification({
          id: `action-${crypto.randomUUID()}`,
          level: "warning",
          title: "No active plan",
          droneName: drone?.name,
          droneId: droneId,
          message: "does not have an approved plan to end.",
          createdAt: new Date().toISOString()
        });
        set({ busyAction: null });
        return;
      }

      if (drone?.status !== "offline") {
        set((state) => ({
          approvals: upsertApproval(state.approvals, droneId, (current) => ({
            id: current?.id ?? String(Math.floor(100000 + Math.random() * 899999)),
            aircraftId: droneId,
            status: "actionrequired",
            startedAt: current?.startedAt ?? new Date().toISOString(),
            planStartedAt: current?.planStartedAt ?? new Date().toISOString(),
            comments: "Land before ending this plan"
          }))
        }));

        addNotification({
          id: `action-${crypto.randomUUID()}`,
          level: "warning",
          title: "Action blocked",
          droneName: drone?.name,
          droneId: droneId,
          message: "must be landed before ending the plan.",
          createdAt: new Date().toISOString()
        });
        set({ busyAction: null });
        return;
      }

      set((state) => ({
        approvals: upsertApproval(state.approvals, droneId, (current) => ({
          id: current?.id ?? String(Math.floor(100000 + Math.random() * 899999)),
          aircraftId: droneId,
          status: "pending",
          startedAt: current?.startedAt ?? new Date().toISOString(),
          planStartedAt: current?.planStartedAt ?? new Date().toISOString(),
          comments: "Plan ended. Request approval to fly again"
        }))
      }));
      setControlStatus(droneId, "offline");
      updateDroneStatus(droneId, "offline");
    }

    const actionLabel =
      action === "takeoff" ? "takeoff" : action === "end-plan" ? "end plan" : action;

    addNotification({
      id: `action-${crypto.randomUUID()}`,
      level: "info",
      title: `Drone action: ${actionLabel}`,
      droneName: drone?.name,
      droneId: droneId,
      message: approval
        ? `command executed for plan ${approval.id}.`
        : "command executed.",
      createdAt: new Date().toISOString()
    });

    set({ busyAction: null });
    }
  };
});
