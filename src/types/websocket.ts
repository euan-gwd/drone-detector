import type { Drone, NotificationItem } from "./drone";
import type { SensorTower, DetectionData, CameraState } from "./sensorTower";

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

export type TowerPositionEvent = Envelope<
  "tower.position",
  {
    tower: SensorTower;
  }
>;

export type TowerStatusEvent = Envelope<
  "tower.status",
  {
    id: string;
    status: SensorTower["status"];
  }
>;

export type TowerDetectionEvent = Envelope<
  "tower.detection",
  {
    detection: DetectionData;
  }
>;

export type CameraStateEvent = Envelope<
  "tower.camera",
  {
    towerId: string;
    camera: CameraState;
  }
>;

export type DroneSocketEvent =
  | DronePositionEvent
  | DroneStatusEvent
  | NotificationEvent
  | ConnectionEvent
  | TowerPositionEvent
  | TowerStatusEvent
  | TowerDetectionEvent
  | CameraStateEvent;
