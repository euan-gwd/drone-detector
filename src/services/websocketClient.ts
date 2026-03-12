import type { DroneSocketEvent } from "../types/websocket";
import { createMockEventBatch, mockInitialDrones, mockInitialTowers } from "./mockWsSimulator";

type EventHandler = (event: DroneSocketEvent) => void;

export class DroneSocketClient {
  private timerId: number | null = null;

  private handlers = new Set<EventHandler>();

  private connected = false;

  private drones = mockInitialDrones();

  private towers = mockInitialTowers();

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
      const events = createMockEventBatch(this.drones, this.towers);
      this.drones = events
        .filter((event) => event.type === "drone.position")
        .map((event) => event.payload.drone);

      // Update towers from tower.position events
      const towerUpdates = events
        .filter((event) => event.type === "tower.position")
        .map((event) => event.payload.tower);
      if (towerUpdates.length > 0) {
        this.towers = towerUpdates;
      }

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
