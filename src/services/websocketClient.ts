import type { DroneSocketEvent } from "../types/websocket";
import { createMockEventBatch, mockInitialDrones } from "./mockWsSimulator";

type EventHandler = (event: DroneSocketEvent) => void;

export class DroneSocketClient {
  private timerId: number | null = null;

  private handlers = new Set<EventHandler>();

  private connected = false;

  private drones = mockInitialDrones();

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  start(): void {
    this.connected = true;
    this.emit({
      version: 1,
      type: "connection.state",
      timestamp: new Date().toISOString(),
      payload: { connected: true }
    });

    this.timerId = window.setInterval(() => {
      const events = createMockEventBatch(this.drones);
      this.drones = events
        .filter((event) => event.type === "drone.position")
        .map((event) => event.payload.drone);

      events.forEach((event) => this.emit(event));
    }, 1200);
  }

  stop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.connected) {
      this.connected = false;
      this.emit({
        version: 1,
        type: "connection.state",
        timestamp: new Date().toISOString(),
        payload: { connected: false }
      });
    }
  }

  private emit(event: DroneSocketEvent): void {
    this.handlers.forEach((handler) => handler(event));
  }
}
