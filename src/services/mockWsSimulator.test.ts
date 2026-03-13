import { createMockEventBatch, mockInitialDrones, mockInitialTowers } from "./mockWsSimulator";
import type { NotificationItem } from "../types/drone";

describe("mockInitialDrones", () => {
  it("returns exactly 3 drones", () => {
    expect(mockInitialDrones()).toHaveLength(3);
  });

  it("returns drones with all required fields", () => {
    mockInitialDrones().forEach((drone) => {
      expect(drone).toHaveProperty("id");
      expect(drone).toHaveProperty("name");
      expect(drone).toHaveProperty("lat");
      expect(drone).toHaveProperty("lon");
      expect(drone).toHaveProperty("altitudeM");
      expect(drone).toHaveProperty("speedMps");
      expect(drone).toHaveProperty("headingDeg");
      expect(drone).toHaveProperty("status");
      expect(drone).toHaveProperty("updatedAt");
    });
  });

  it("returns the same drone data on repeated calls", () => {
    const a = mockInitialDrones();
    const b = mockInitialDrones();
    expect(a).toEqual(b);
  });
});

describe("createMockEventBatch", () => {
  const initial = mockInitialDrones();
  const towers = mockInitialTowers();

  it("emits one drone.position event per drone", () => {
    const batch = createMockEventBatch(initial, towers);
    const positionEvents = batch.filter((e) => e.type === "drone.position");
    expect(positionEvents).toHaveLength(initial.length);
  });

  it("position events carry valid drone payloads", () => {
    const batch = createMockEventBatch(initial, towers);
    batch
      .filter((e) => e.type === "drone.position")
      .forEach((event) => {
        expect(event.payload).toHaveProperty("drone");
        expect((event.payload as { drone: { id: string } }).drone.id).toBeTruthy();
      });
  });

  it("every event has version 1", () => {
    const batch = createMockEventBatch(initial, towers);
    batch.forEach((event) => expect(event.version).toBe(1));
  });

  it("only emits drone.position and notification.created event types", () => {
    const validTypes = new Set(["drone.position", "notification.created", "tower.position", "tower.detection", "tower.camera"]);
    // Run many batches to exercise the random notification branch
    for (let i = 0; i < 30; i++) {
      createMockEventBatch(initial, towers).forEach((e) => {
        expect(validTypes.has(e.type)).toBe(true);
      });
    }
  });

  it("drones drift their position on each batch", () => {
    const batch = createMockEventBatch(initial, towers);
    const updatedPositions = batch
      .filter((e) => e.type === "drone.position")
      .map((e) => (e.payload as { drone: { lat: number; lon: number } }).drone);

    updatedPositions.forEach((updated, i) => {
      // At least one coordinate must have changed (drift is non-zero)
      const original = initial[i];
      expect(updated.lat !== original.lat || updated.lon !== original.lon).toBe(true);
    });
  });
});

describe("notification titles", () => {
  const initial = mockInitialDrones();
  const towers = mockInitialTowers();

  // Each drone consumes 5 Math.random() calls (speed, lat, lon, altitude, heading).
  // With 3 drones that is 15 calls before the non-drone branches.
  // The current simulator then does:
  //   index 15 → tower.position branch
  //   index 16 → tower.camera branch
  //   index 17-18 → tower.detection checks for the 2 towers
  //   index 19 → notification trigger check (> 0.72 fires)
  //   index 20 → drone selection (Math.floor(x * 3))
  //   index 21 → level selection when drone is online (Math.floor(x * 2): 0 = info, 1 = success)
  //
  // drn-102 starts at 14 m/s; with neutral drift (0.5) it stays at 14 → warning status.
  // drn-304 (11 m/s) and drn-401 (10 m/s) stay online with neutral drift.
  function mockRandom(overrides: Record<number, number>) {
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      const val = overrides[callCount] ?? 0.5;
      callCount++;
      return val;
    });
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function extractNotification(batch: ReturnType<typeof createMockEventBatch>): NotificationItem | null {
    const event = batch.find((e) => e.type === "notification.created");
    if (!event) return null;
    return (event.payload as { notification: NotificationItem }).notification;
  }

  it("warning notifications carry title 'Speed caution'", () => {
    mockRandom({ 19: 0.8, 20: 0.1 });
    const notif = extractNotification(createMockEventBatch(initial, towers));
    expect(notif).not.toBeNull();
    expect(notif!.level).toBe("warning");
    expect(notif!.title).toBe("Speed caution");
    expect(notif!.droneId).toBe("drn-102");
  });

  it("info notifications carry title 'Flight update'", () => {
    mockRandom({ 19: 0.8, 20: 0.99, 21: 0.1 });
    const notif = extractNotification(createMockEventBatch(initial, towers));
    expect(notif).not.toBeNull();
    expect(notif!.level).toBe("info");
    expect(notif!.title).toBe("Flight update");
  });

  it("success notifications carry title 'Flight update'", () => {
    mockRandom({ 19: 0.8, 20: 0.99, 21: 0.9 });
    const notif = extractNotification(createMockEventBatch(initial, towers));
    expect(notif).not.toBeNull();
    expect(notif!.level).toBe("success");
    expect(notif!.title).toBe("Flight update");
  });

  it("notification events include droneName and droneId", () => {
    mockRandom({ 19: 0.8, 20: 0.1 }); // warning from drn-102
    const notif = extractNotification(createMockEventBatch(initial, towers));
    expect(notif).not.toBeNull();
    expect(notif!.droneName).toBe("North Watcher");
    expect(notif!.droneId).toBe("drn-102");
    expect(notif!.createdAt).toBeTruthy();
  });
});
