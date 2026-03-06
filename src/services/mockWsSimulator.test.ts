import { createMockEventBatch, mockInitialDrones } from "./mockWsSimulator";

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

  it("emits one drone.position event per drone", () => {
    const batch = createMockEventBatch(initial);
    const positionEvents = batch.filter((e) => e.type === "drone.position");
    expect(positionEvents).toHaveLength(initial.length);
  });

  it("position events carry valid drone payloads", () => {
    const batch = createMockEventBatch(initial);
    batch
      .filter((e) => e.type === "drone.position")
      .forEach((event) => {
        expect(event.payload).toHaveProperty("drone");
        expect((event.payload as { drone: { id: string } }).drone.id).toBeTruthy();
      });
  });

  it("every event has version 1", () => {
    const batch = createMockEventBatch(initial);
    batch.forEach((event) => expect(event.version).toBe(1));
  });

  it("only emits drone.position and notification.created event types", () => {
    const validTypes = new Set(["drone.position", "notification.created"]);
    // Run many batches to exercise the random notification branch
    for (let i = 0; i < 30; i++) {
      createMockEventBatch(initial).forEach((e) => {
        expect(validTypes.has(e.type)).toBe(true);
      });
    }
  });

  it("drones drift their position on each batch", () => {
    const batch = createMockEventBatch(initial);
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
