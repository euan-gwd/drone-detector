import type { Drone, NotificationItem } from "./drone";

interface Envelope<TType extends string, TPayload> {
  version: 1;
  type: TType;
  timestamp: string;
  payload: TPayload;
}

export type DronePositionEvent = Envelope<
  "drone.position",
  {
    drone: Drone;
  }
>;

export type DroneStatusEvent = Envelope<
  "drone.status",
  {
    id: string;
    status: Drone["status"];
  }
>;

export type NotificationEvent = Envelope<
  "notification.created",
  {
    notification: NotificationItem;
  }
>;

export type ConnectionEvent = Envelope<
  "connection.state",
  {
    connected: boolean;
  }
>;

export type DroneSocketEvent =
  | DronePositionEvent
  | DroneStatusEvent
  | NotificationEvent
  | ConnectionEvent;
