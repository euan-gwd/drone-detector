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
  message: string;
  createdAt: string;
}
