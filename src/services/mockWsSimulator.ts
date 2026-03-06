import type { Drone, NotificationItem } from "../types/drone";
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
    status: "warning"
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

// Small random lat/lon offset per tick; 0.0026° ≈ 200 m at UK latitudes
const drift = () => (Math.random() - 0.5) * 0.0026;

/**
 * Builds a NotificationItem for a drone event.
 *
 * The `droneName` and `droneId` fields are set so the notification panel can
 * highlight the drone name without needing to parse the message string.
 * The `message` field contains only the descriptive text (no drone prefix).
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
      title: "Status nominal",
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
    // Structured fields let the UI highlight the drone name without regex parsing
    droneName: drone.name,
    droneId: drone.id,
    createdAt: new Date().toISOString()
  };
};

/**
 * Produces one batch of WebSocket events for a single simulator tick.
 *
 * Each call moves every drone slightly and may append one notification event.
 * Calling this function produces different results each time (stochastic) —
 * this is intentional for UI development. For deterministic testing, replace
 * `createMockEventBatch` with a seeded version.
 */
export const createMockEventBatch = (previous: Drone[]): DroneSocketEvent[] => {
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

  // 28% chance of generating one notification per tick (≈ 1 notification every 4 s at 1.2 s tick)
  if (Math.random() > 0.72) {
    // Pick a random drone to associate the notification with
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
