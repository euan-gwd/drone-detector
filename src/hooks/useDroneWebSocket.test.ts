import { renderHook, act } from "@testing-library/react";
import { useDroneWebSocket } from "./useDroneWebSocket";
import { useDroneStore } from "../store/droneStore";
import { useNotificationStore } from "../store/notificationStore";
import { useUiStore } from "../store/uiStore";
import type { Drone } from "../types/drone";

// vi.hoisted ensures these variables are defined before vi.mock is called
const mocks = vi.hoisted(() => {
  const mockUnsubscribe = vi.fn();
  const mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe);
  const mockStart = vi.fn();
  const mockStop = vi.fn();
  return { mockUnsubscribe, mockSubscribe, mockStart, mockStop };
});

vi.mock("../services/websocketClient", () => ({
  DroneSocketClient: vi.fn(() => ({
    subscribe: mocks.mockSubscribe,
    start: mocks.mockStart,
    stop: mocks.mockStop,
  })),
}));

const makeDrone = (id: string): Drone => ({
  id,
  name: `Drone ${id}`,
  lat: 51.5,
  lon: -1.2,
  altitudeM: 100,
  speedMps: 10,
  headingDeg: 90,
  updatedAt: new Date().toISOString(),
  status: "online",
});

describe("useDroneWebSocket", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useDroneStore.setState({ drones: {}, selectedDroneId: null, controlStatusByDrone: {} });
    useNotificationStore.setState({ items: [] });
    useUiStore.setState({ connected: false });
    mocks.mockStart.mockClear();
    mocks.mockStop.mockClear();
    mocks.mockSubscribe.mockClear();
    mocks.mockUnsubscribe.mockClear();
  });

  it("subscribes and starts the client on mount", () => {
    renderHook(() => useDroneWebSocket());
    expect(mocks.mockSubscribe).toHaveBeenCalledOnce();
    expect(mocks.mockStart).toHaveBeenCalledOnce();
  });

  it("unsubscribes and stops the client on unmount", () => {
    const { unmount } = renderHook(() => useDroneWebSocket());
    unmount();
    expect(mocks.mockUnsubscribe).toHaveBeenCalledOnce();
    expect(mocks.mockStop).toHaveBeenCalledOnce();
  });

  it("routes drone.position events to droneStore", () => {
    renderHook(() => useDroneWebSocket());
    const handler = mocks.mockSubscribe.mock.calls[0]?.[0] as (e: unknown) => void;

    act(() => {
      handler({
        version: 1,
        type: "drone.position",
        timestamp: new Date().toISOString(),
        payload: { drone: makeDrone("drn-test") },
      });
    });

    expect(useDroneStore.getState().drones["drn-test"]).toBeDefined();
  });

  it("routes drone.status events to droneStore", () => {
    useDroneStore.setState({ drones: { "drn-1": makeDrone("drn-1") } });
    renderHook(() => useDroneWebSocket());
    const handler = mocks.mockSubscribe.mock.calls[0]?.[0] as (e: unknown) => void;

    act(() => {
      handler({
        version: 1,
        type: "drone.status",
        timestamp: new Date().toISOString(),
        payload: { id: "drn-1", status: "warning" },
      });
    });

    expect(useDroneStore.getState().drones["drn-1"].status).toBe("warning");
  });

  it("routes notification.created events to notificationStore", () => {
    renderHook(() => useDroneWebSocket());
    const handler = mocks.mockSubscribe.mock.calls[0]?.[0] as (e: unknown) => void;

    act(() => {
      handler({
        version: 1,
        type: "notification.created",
        timestamp: new Date().toISOString(),
        payload: {
          notification: {
            id: "notif-1",
            level: "info",
            title: "Test",
            message: "Hello",
            createdAt: new Date().toISOString(),
          },
        },
      });
    });

    expect(useNotificationStore.getState().items[0].id).toBe("notif-1");
  });

  it("routes connection.state events to uiStore", () => {
    renderHook(() => useDroneWebSocket());
    const handler = mocks.mockSubscribe.mock.calls[0]?.[0] as (e: unknown) => void;

    act(() => {
      handler({
        version: 1,
        type: "connection.state",
        timestamp: new Date().toISOString(),
        payload: { connected: true },
      });
    });

    expect(useUiStore.getState().connected).toBe(true);
  });
});
