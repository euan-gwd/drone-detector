import { useDroneStore } from "./droneStore";
import { useFlightStore } from "./flightStore";
import { useNotificationStore } from "./notificationStore";
import type { Drone, FlightApproval } from "../types/drone";

const makeDrone = (id: string, overrides?: Partial<Drone>): Drone => ({
  id,
  name: `Drone ${id}`,
  lat: 51.5,
  lon: -1.2,
  altitudeM: 100,
  speedMps: 10,
  headingDeg: 90,
  updatedAt: new Date().toISOString(),
  status: "online",
  ...overrides,
});

const makeApproval = (aircraftId: string, overrides?: Partial<FlightApproval>): FlightApproval => ({
  id: "A001",
  aircraftId,
  status: "approved",
  startedAt: new Date().toISOString(),
  planStartedAt: new Date().toISOString(),
  comments: "",
  ...overrides,
});

describe("flightStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    useDroneStore.setState({ drones: {}, selectedDroneId: null, controlStatusByDrone: {} });
    useNotificationStore.setState({ items: [] });
    useFlightStore.setState({ approvals: [], busyAction: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── seedApprovals ────────────────────────────────────────────────────────────

  describe("seedApprovals", () => {
    it("replaces the approvals list", () => {
      useFlightStore.getState().seedApprovals([makeApproval("drn-1")]);
      expect(useFlightStore.getState().approvals).toHaveLength(1);
    });

    it("sets control to offline for pending items during seeding", () => {
      useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1") } });
      useFlightStore.getState().seedApprovals([makeApproval("drn-1", { status: "pending" })]);
      expect(useDroneStore.getState().controlStatusByDrone["drn-1"]).toBe("offline");
    });
  });

  // ── runAction: request-approval ──────────────────────────────────────────────

  describe("runAction – request-approval", () => {
    it("creates an approved plan and adds a success notification", async () => {
      useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1") } });
      const promise = useFlightStore.getState().runAction("drn-1", "request-approval");
      await vi.runAllTimersAsync();
      await promise;

      const approval = useFlightStore.getState().approvals.find((a) => a.aircraftId === "drn-1");
      expect(approval?.status).toBe("approved");
      expect(useNotificationStore.getState().items[0].level).toBe("success");
    });
  });

  // ── runAction: takeoff ───────────────────────────────────────────────────────

  describe("runAction – takeoff", () => {
    it("sets the drone online when the plan is approved", async () => {
      useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1", { status: "offline" }) } });
      useFlightStore.setState({ approvals: [makeApproval("drn-1")], busyAction: null });

      const promise = useFlightStore.getState().runAction("drn-1", "takeoff");
      await vi.runAllTimersAsync();
      await promise;

      expect(useDroneStore.getState().drones["drn-1"].status).toBe("online");
    });

    it("blocks takeoff when the plan is pending and adds a warning", async () => {
      useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1") } });
      useFlightStore.setState({
        approvals: [makeApproval("drn-1", { status: "pending" })],
        busyAction: null,
      });

      const promise = useFlightStore.getState().runAction("drn-1", "takeoff");
      await vi.runAllTimersAsync();
      await promise;

      expect(useNotificationStore.getState().items[0].level).toBe("warning");
    });
  });

  // ── runAction: land ──────────────────────────────────────────────────────────

  describe("runAction – land", () => {
    it("sets the drone control status to offline", async () => {
      useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1", { status: "online" }) } });
      useFlightStore.setState({ approvals: [makeApproval("drn-1")], busyAction: null });

      const promise = useFlightStore.getState().runAction("drn-1", "land");
      await vi.runAllTimersAsync();
      await promise;

      expect(useDroneStore.getState().controlStatusByDrone["drn-1"]).toBe("offline");
    });
  });

  // ── runAction: end-plan ──────────────────────────────────────────────────────

  describe("runAction – end-plan", () => {
    it("blocks while the drone is still airborne and adds a warning", async () => {
      useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1", { status: "online" }) } });
      useFlightStore.setState({ approvals: [makeApproval("drn-1")], busyAction: null });

      const promise = useFlightStore.getState().runAction("drn-1", "end-plan");
      await vi.runAllTimersAsync();
      await promise;

      const notif = useNotificationStore.getState().items[0];
      expect(notif.level).toBe("warning");
      expect(notif.title).toBe("Action blocked");
    });

    it("ends the plan and resets approval to pending when drone is landed", async () => {
      useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1", { status: "offline" }) } });
      useFlightStore.setState({ approvals: [makeApproval("drn-1")], busyAction: null });

      const promise = useFlightStore.getState().runAction("drn-1", "end-plan");
      await vi.runAllTimersAsync();
      await promise;

      const approval = useFlightStore.getState().approvals.find((a) => a.aircraftId === "drn-1");
      expect(approval?.status).toBe("pending");
    });
  });

  // ── busyAction lifecycle ─────────────────────────────────────────────────────

  it("sets busyAction while a command is processing and clears it afterwards", async () => {
    useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1") } });
    useFlightStore.setState({ approvals: [], busyAction: null });

    const promise = useFlightStore.getState().runAction("drn-1", "request-approval");
    expect(useFlightStore.getState().busyAction).toBe("request-approval");

    await vi.runAllTimersAsync();
    await promise;

    expect(useFlightStore.getState().busyAction).toBeNull();
  });
});
