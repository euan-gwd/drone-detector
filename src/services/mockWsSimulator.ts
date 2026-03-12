import type { Drone, NotificationItem } from "../types/drone";
import type { SensorTower, CameraState, DetectionData } from "../types/sensorTower";
import type { DroneSocketEvent } from "../types/websocket";

const baseDrones: Drone[] = [
  {
    id: "drn-102",
    name: "North Watcher",
    lat: 51.788,
    lon: -1.258,
    altitudeM: 123,
    speedMps: 14,
    headingDeg: 78,
    updatedAt: new Date().toISOString(),
    status: "online"
  },
  {
    id: "drn-304",
    name: "Valley Scout",
    lat: 51.742,
    lon: -1.312,
    altitudeM: 88,
    speedMps: 11,
    headingDeg: 25,
    updatedAt: new Date().toISOString(),
    status: "online"
  },
  {
    id: "drn-401",
    name: "Grid Runner",
    lat: 51.738,
    lon: -1.198,
    altitudeM: 101,
    speedMps: 10,
    headingDeg: 140,
    updatedAt: new Date().toISOString(),
    status: "online"
  }
];

const baseTowers: SensorTower[] = [
  {
    id: "tower-alpha",
    name: "Tower Alpha",
    lat: 51.780,
    lon: -1.245,
    altitudeM: 45,
    status: "online",
    range: 5000,
    updatedAt: new Date().toISOString(),
    sensors: [
      {
        id: "radar-1",
        towerId: "tower-alpha",
        type: "radar",
        status: "active",
        signalStrength: 0.85,
        lastDetection: new Date().toISOString()
      },
      {
        id: "lidar-1",
        towerId: "tower-alpha",
        type: "lidar",
        status: "active",
        signalStrength: 0.92,
        lastDetection: new Date().toISOString()
      }
    ],
    cameras: [
      {
        id: "cam-1",
        towerId: "tower-alpha",
        name: "Camera 1",
        azimuth: 45,
        elevation: 10,
        fieldOfView: 60,
        zoom: 1.0,
        status: "active",
        updatedAt: new Date().toISOString()
      },
      {
        id: "cam-2",
        towerId: "tower-alpha",
        name: "Camera 2",
        azimuth: 225,
        elevation: 15,
        fieldOfView: 45,
        zoom: 1.5,
        status: "active",
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: "tower-bravo",
    name: "Tower Bravo",
    lat: 51.740,
    lon: -1.290,
    altitudeM: 38,
    status: "online",
    range: 4500,
    updatedAt: new Date().toISOString(),
    sensors: [
      {
        id: "radar-2",
        towerId: "tower-bravo",
        type: "radar",
        status: "active",
        signalStrength: 0.78,
        lastDetection: new Date().toISOString()
      },
      {
        id: "thermal-1",
        towerId: "tower-bravo",
        type: "thermal",
        status: "active",
        signalStrength: 0.71,
        lastDetection: new Date().toISOString()
      }
    ],
    cameras: [
      {
        id: "cam-3",
        towerId: "tower-bravo",
        name: "Camera 3",
        azimuth: 120,
        elevation: 8,
        fieldOfView: 75,
        zoom: 1.2,
        status: "active",
        updatedAt: new Date().toISOString()
      }
    ]
  }
];

// Small random lat/lon offset per tick; 0.0026° ≈ 200 m at UK latitudes
const drift = () => (Math.random() - 0.5) * 0.0026;

/**
 * Builds a structured notification payload for a drone event.
 */
const makeNotification = (drone: Drone, level: NotificationItem["level"]): NotificationItem => {
  const messages: Record<NotificationItem["level"], { title: string; message: string }> = {
    warning: {
      title: "Speed caution",
      message: `has entered the caution speed band at ${drone.speedMps.toFixed(1)} m/s`
    },
    info: {
      title: "Flight update",
      message: "flight plan remains approved and active"
    },
    success: {
      title: "Flight update",
      message: "has returned to normal operating parameters"
    },
    error: {
      title: "Flight error",
      message: "reported an unexpected error — review required"
    }
  };

  return {
    id: `notif-${crypto.randomUUID()}`,
    level,
    title: messages[level].title,
    message: messages[level].message,
    // Keep structured identifiers so UI rendering does not rely on message parsing.
    droneName: drone.name,
    droneId: drone.id,
    createdAt: new Date().toISOString()
  };
};

/**
 * Produces one simulator tick: updated positions for all drones plus
 * tower updates, camera movements, and optional detection/notification events.
 */
export const createMockEventBatch = (previous: Drone[], towers: SensorTower[]): DroneSocketEvent[] => {
  const updated = previous.map((drone) => {
    // Speed changes by up to ±1.05 m/s per tick; minimum hover speed is 3 m/s
    const nextSpeed = Math.max(3, drone.speedMps + (Math.random() - 0.5) * 2.1);
    return {
      ...drone,
      // Max position jitter ≈ 200 m per tick (0.0026° ≈ 200 m at UK latitudes)
      lat: drone.lat + drift(),
      lon: drone.lon + drift(),
      // Altitude drifts by up to ±2 m per tick; floor at 20 m AGL
      altitudeM: Math.max(20, drone.altitudeM + Math.round((Math.random() - 0.5) * 4)),
      speedMps: Number(nextSpeed.toFixed(1)),
      // Heading drifts by up to ±9° per tick; wraps around at 360°
      headingDeg: Math.round((drone.headingDeg + (Math.random() - 0.5) * 18 + 360) % 360),
      updatedAt: new Date().toISOString(),
      // Speeds above 13.6 m/s trigger the caution (warning) status
      status: nextSpeed > 13.6 ? "warning" : "online"
    } as Drone;
  });

  const events: DroneSocketEvent[] = updated.map((drone) => ({
    version: 1,
    type: "drone.position",
    timestamp: new Date().toISOString(),
    payload: { drone }
  }));

  // Generate tower position updates (less frequent than drones)
  if (Math.random() > 0.7) {
    towers.forEach((tower) => {
      events.push({
        version: 1,
        type: "tower.position",
        timestamp: new Date().toISOString(),
        payload: { tower }
      });
    });
  }

  // Generate camera movements (30% chance per tick)
  if (Math.random() > 0.7) {
    towers.forEach((tower) => {
      tower.cameras.forEach((camera) => {
        // Simulate camera rotation: ±20° azimuth change, slight elevation adjustment
        const updatedCamera: CameraState = {
          ...camera,
          azimuth: Math.round((camera.azimuth + (Math.random() - 0.5) * 40 + 360) % 360),
          elevation: Math.max(0, Math.min(45, camera.elevation + (Math.random() - 0.5) * 6)),
          updatedAt: new Date().toISOString()
        };

        events.push({
          version: 1,
          type: "tower.camera",
          timestamp: new Date().toISOString(),
          payload: { towerId: tower.id, camera: updatedCamera }
        });
      });
    });
  }

  // Generate detection events (20% chance per tower per tick)
  towers.forEach((tower) => {
    if (Math.random() > 0.8) {
      const nearbyDrone = updated.find((drone) => {
        // Simple distance check - within tower range
        const latDiff = Math.abs(drone.lat - tower.lat);
        const lonDiff = Math.abs(drone.lon - tower.lon);
        const approximateDistance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111000; // Rough km to m
        return approximateDistance <= tower.range;
      });

      if (nearbyDrone) {
        const detection: DetectionData = {
          id: `detection-${crypto.randomUUID()}`,
          towerId: tower.id,
          sensorId: tower.sensors[0]?.id || "unknown",
          droneId: nearbyDrone.id,
          distance: Math.random() * tower.range,
          bearing: Math.round(Math.random() * 360),
          confidence: 0.7 + Math.random() * 0.3,
          signalStrength: 0.6 + Math.random() * 0.4,
          timestamp: new Date().toISOString()
        };

        events.push({
          version: 1,
          type: "tower.detection",
          timestamp: new Date().toISOString(),
          payload: { detection }
        });
      }
    }
  });

  // 28% chance of generating one notification per tick (~1 every 4s at 1.2s cadence).
  if (Math.random() > 0.72) {
    // Associate the notification with a random drone from this tick.
    const triggeringDrone = updated[Math.floor(Math.random() * updated.length)];
    const level = triggeringDrone.status === "warning"
      ? "warning"
      : (["info", "success"] as NotificationItem["level"][])[Math.floor(Math.random() * 2)];

    events.push({
      version: 1,
      type: "notification.created",
      timestamp: new Date().toISOString(),
      payload: { notification: makeNotification(triggeringDrone, level) }
    });
  }

  return events;
};

export const mockInitialDrones = (): Drone[] => baseDrones;

export const mockInitialTowers = (): SensorTower[] => baseTowers;
