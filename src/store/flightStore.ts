import { create } from "zustand";
import type { FlightApproval } from "../types/drone";
import { useDroneStore } from "./droneStore";
import { useNotificationStore } from "./notificationStore";

type FlightAction = "view" | "request-approval" | "end-plan" | "land" | "takeoff";

interface FlightStore {
  approvals: FlightApproval[];
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

export const useFlightStore = create<FlightStore>((set, get) => ({
  approvals: [],
  busyAction: null,
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
    await wait(900);

    const droneState = useDroneStore.getState();
    const updateDroneStatus = droneState.updateDroneStatus;
    const setControlStatus = droneState.setControlStatus;
    const drone = droneState.drones[droneId] ?? null;
    const addNotification = useNotificationStore.getState().addNotification;
    const approval = get().approvals.find((item) => item.aircraftId === droneId);

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
        message: `${droneId} is approved and ready for takeoff.`,
        createdAt: new Date().toISOString()
      });

      set({ busyAction: null });
      return;
    }

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
        message: `${droneId} needs an approved flight plan first.`,
        createdAt: new Date().toISOString()
      });
      set({ busyAction: null });
      return;
    }

    if (action === "land") {
      setControlStatus(droneId, "offline");
      updateDroneStatus(droneId, "offline");
    }

    if (action === "takeoff") {
      setControlStatus(droneId, "online");
      updateDroneStatus(droneId, "online");
    }

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
          message: `${droneId} does not have an approved plan to end.`,
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
          message: `${droneId} must be landed before ending the plan.`,
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
      message: approval
        ? `${droneId} command executed for plan ${approval.id}.`
        : `${droneId} command executed.`,
      createdAt: new Date().toISOString()
    });

    set({ busyAction: null });
  }
}));
