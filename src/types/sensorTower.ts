export type TowerStatus = "online" | "offline" | "maintenance" | "error";
export type SensorType = "radar" | "lidar" | "thermal" | "optical" | "radio";
export type SensorStatus = "active" | "inactive" | "error" | "calibrating";

export interface SensorTower {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitudeM: number;
  status: TowerStatus;
  range: number; // detection range in meters
  updatedAt: string;
  sensors: TowerSensor[];
  cameras: CameraState[];
}

export interface TowerSensor {
  id: string;
  towerId: string;
  type: SensorType;
  status: SensorStatus;
  signalStrength: number;
  lastDetection: string | null;
  errorMessage?: string;
}

export interface CameraState {
  id: string;
  towerId: string;
  name: string;
  azimuth: number; // direction in degrees (0-360)
  elevation: number; // vertical angle in degrees
  fieldOfView: number; // horizontal FOV in degrees
  zoom: number;
  status: SensorStatus;
  updatedAt: string;
}

export interface DetectionData {
  id: string;
  towerId: string;
  sensorId: string;
  droneId: string;
  distance: number; // distance in meters
  bearing: number; // bearing in degrees
  confidence: number; // 0-1 confidence score
  signalStrength: number;
  timestamp: string;
}

export interface TowerDetectionSummary {
  towerId: string;
  activeDetections: DetectionData[];
  totalDetections: number;
  lastUpdate: string;
}