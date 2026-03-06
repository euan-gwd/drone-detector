export type DroneStatus = "online" | "warning" | "offline";

export interface Drone {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitudeM: number;
  speedMps: number;
  headingDeg: number;
  updatedAt: string;
  status: DroneStatus;
}

export interface FlightApproval {
  id: string;
  aircraftId: string;
  status: "approved" | "pending" | "actionrequired" | "rejected";
  startedAt: string;
  planStartedAt: string;
  comments: string;
}

export interface NotificationItem {
  id: string;
  level: "info" | "success" | "warning" | "error";
  title: string;
  /**
   * Full text of the notification. May optionally start with a drone-name prefix
   * for backwards-compatible plain-string messages.
   * When `droneName` and `droneId` are provided, this field contains only the
   * descriptive part of the message (without the drone identifier prefix).
   */
  message: string;
  /** Human-readable drone name associated with this notification, e.g. "North Watcher". */
  droneName?: string;
  /** Machine ID of the drone associated with this notification, e.g. "drn-102". */
  droneId?: string;
  createdAt: string;
}
