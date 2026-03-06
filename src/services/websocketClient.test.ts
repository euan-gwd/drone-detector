import { DroneSocketClient } from "./websocketClient";
import type { DroneSocketEvent } from "../types/websocket";

describe("DroneSocketClient", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("emits connection.state connected=true immediately on start", () => {
    const client = new DroneSocketClient();
    const handler = vi.fn();
    client.subscribe(handler);
    client.start();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining<Partial<DroneSocketEvent>>({
        type: "connection.state",
        payload: { connected: true },
      }),
    );
    client.stop();
  });

  it("emits connection.state connected=false on stop", () => {
    const client = new DroneSocketClient();
    const handler = vi.fn();
    client.subscribe(handler);
    client.start();
    handler.mockClear();
    client.stop();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining<Partial<DroneSocketEvent>>({
        type: "connection.state",
        payload: { connected: false },
      }),
    );
  });

  it("does not emit any event when stop is called before start", () => {
    const client = new DroneSocketClient();
    const handler = vi.fn();
    client.subscribe(handler);
    client.stop();

    expect(handler).not.toHaveBeenCalled();
  });

  it("unsubscribe prevents the handler from receiving further events", () => {
    const client = new DroneSocketClient();
    const handler = vi.fn();
    const unsubscribe = client.subscribe(handler);
    unsubscribe();
    client.start();

    expect(handler).not.toHaveBeenCalled();
    client.stop();
  });

  it("emits drone.position events after each interval tick", () => {
    const client = new DroneSocketClient();
    const handler = vi.fn();
    client.subscribe(handler);
    client.start();
    handler.mockClear();

    vi.advanceTimersByTime(1200);

    const positionEvents = handler.mock.calls
      .flat()
      .filter((e) => (e as DroneSocketEvent).type === "drone.position");
    expect(positionEvents.length).toBeGreaterThan(0);

    client.stop();
  });

  it("stop clears the interval so no further batches are emitted", () => {
    const client = new DroneSocketClient();
    const handler = vi.fn();
    client.subscribe(handler);
    client.start();
    client.stop();
    const callsAfterStop = handler.mock.calls.length;

    vi.advanceTimersByTime(10_000);

    expect(handler.mock.calls.length).toBe(callsAfterStop);
  });

  it("supports multiple subscribers receiving the same event", () => {
    const client = new DroneSocketClient();
    const h1 = vi.fn();
    const h2 = vi.fn();
    client.subscribe(h1);
    client.subscribe(h2);
    client.start();

    expect(h1).toHaveBeenCalled();
    expect(h2).toHaveBeenCalled();
    client.stop();
  });
});
