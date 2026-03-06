import { useDroneStore } from "./droneStore";
import type { Drone } from "../types/drone";

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

describe("droneStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useDroneStore.setState({
      drones: {},
      selectedDroneId: null,
      controlStatusByDrone: {},
    });
  });

  // ── upsertDrone ─────────────────────────────────────────────────────────────

  describe("upsertDrone", () => {
    it("adds a new drone", () => {
      const drone = makeDrone("drn-1");
      useDroneStore.getState().upsertDrone(drone);
      expect(useDroneStore.getState().drones["drn-1"]).toMatchObject({ id: "drn-1" });
    });

    it("updates an existing drone with new telemetry", () => {
      useDroneStore.getState().upsertDrone(makeDrone("drn-1", { altitudeM: 100 }));
      useDroneStore.getState().upsertDrone(makeDrone("drn-1", { altitudeM: 200 }));
      expect(useDroneStore.getState().drones["drn-1"].altitudeM).toBe(200);
    });

    it("overrides status with the active controlledStatus", () => {
      useDroneStore.setState({ controlStatusByDrone: { "drn-1": "warning" } });
      useDroneStore.getState().upsertDrone(makeDrone("drn-1", { status: "online" }));
      expect(useDroneStore.getState().drones["drn-1"].status).toBe("warning");
    });

    it("freezes lat/lon and zeroes flight data when the drone is controlled as offline (landed)", () => {
      useDroneStore.setState({
        drones: { "drn-1": makeDrone("drn-1", { lat: 10, lon: 20 }) },
        controlStatusByDrone: { "drn-1": "offline" },
      });

      // Simulate an incoming position update with a different position
      useDroneStore.getState().upsertDrone(
        makeDrone("drn-1", { lat: 99, lon: 99, altitudeM: 500, speedMps: 25 }),
      );

      const stored = useDroneStore.getState().drones["drn-1"];
      expect(stored.lat).toBe(10); // frozen to the last known position
      expect(stored.lon).toBe(20);
      expect(stored.altitudeM).toBe(0);
      expect(stored.speedMps).toBe(0);
    });
  });

  // ── updateDroneStatus ────────────────────────────────────────────────────────

  describe("updateDroneStatus", () => {
    it("changes the status of an existing drone", () => {
      useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1", { status: "online" }) } });
      useDroneStore.getState().updateDroneStatus("drn-1", "warning");
      expect(useDroneStore.getState().drones["drn-1"].status).toBe("warning");
    });

    it("is a no-op for an unknown drone id", () => {
      const before = useDroneStore.getState().drones;
      useDroneStore.getState().updateDroneStatus("drn-unknown", "warning");
      expect(useDroneStore.getState().drones).toEqual(before);
    });

    it("preserves a controlledStatus over the incoming status", () => {
      useDroneStore.setState({
        drones: { "drn-1": makeDrone("drn-1") },
        controlStatusByDrone: { "drn-1": "offline" },
      });
      useDroneStore.getState().updateDroneStatus("drn-1", "online");
      expect(useDroneStore.getState().drones["drn-1"].status).toBe("offline");
    });
  });

  // ── setControlStatus ─────────────────────────────────────────────────────────

  describe("setControlStatus", () => {
    it("stores a control status override", () => {
      useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1") } });
      useDroneStore.getState().setControlStatus("drn-1", "warning");
      expect(useDroneStore.getState().controlStatusByDrone["drn-1"]).toBe("warning");
    });

    it("removes the override when passed null", () => {
      useDroneStore.setState({
        drones: { "drn-1": makeDrone("drn-1") },
        controlStatusByDrone: { "drn-1": "warning" },
      });
      useDroneStore.getState().setControlStatus("drn-1", null);
      expect(useDroneStore.getState().controlStatusByDrone["drn-1"]).toBeUndefined();
    });

    it("zeroes altitude and speed when controlling offline", () => {
      useDroneStore.setState({
        drones: { "drn-1": makeDrone("drn-1", { altitudeM: 150, speedMps: 20 }) },
      });
      useDroneStore.getState().setControlStatus("drn-1", "offline");
      const stored = useDroneStore.getState().drones["drn-1"];
      expect(stored.altitudeM).toBe(0);
      expect(stored.speedMps).toBe(0);
    });
  });

  // ── selectDrone ──────────────────────────────────────────────────────────────

  describe("selectDrone", () => {
    it("sets selectedDroneId", () => {
      useDroneStore.getState().selectDrone("drn-1");
      expect(useDroneStore.getState().selectedDroneId).toBe("drn-1");
    });

    it("clears selectedDroneId when passed null", () => {
      useDroneStore.setState({ selectedDroneId: "drn-1" });
      useDroneStore.getState().selectDrone(null);
      expect(useDroneStore.getState().selectedDroneId).toBeNull();
    });
  });
});
