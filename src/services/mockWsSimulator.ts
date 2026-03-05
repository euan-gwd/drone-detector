import type { Drone, NotificationItem } from "../types/drone";
import type { DroneSocketEvent } from "../types/websocket";

const baseDrones: Drone[] = [
  {
    id: "drn-102",
    name: "North Watcher",
    lat: 51.9064,
    lon: -0.5019,
    altitudeM: 123,
    speedMps: 14,
    headingDeg: 78,
    updatedAt: new Date().toISOString(),
    status: "online"
  },
  {
    id: "drn-304",
    name: "Valley Scout",
    lat: 51.8293,
    lon: -0.6372,
    altitudeM: 88,
    speedMps: 11,
    headingDeg: 25,
    updatedAt: new Date().toISOString(),
    status: "warning"
  },
  {
    id: "drn-401",
    name: "Grid Runner",
    lat: 51.8709,
    lon: -0.4562,
    altitudeM: 101,
    speedMps: 10,
    headingDeg: 140,
    updatedAt: new Date().toISOString(),
    status: "online"
  }
];

const drift = () => (Math.random() - 0.5) * 0.0026;

const randomNotification = (): NotificationItem => {
  const levels: NotificationItem["level"][] = ["success", "info", "warning"];
  const level = levels[Math.floor(Math.random() * levels.length)];
  return {
    id: `notif-${crypto.randomUUID()}`,
    level,
    title: level === "warning" ? "Flight attention" : "Flight update",
    message:
      level === "warning"
        ? "One drone entered caution speed band"
        : "Flight plan remains approved and active",
    createdAt: new Date().toISOString()
  };
};

export const createMockEventBatch = (previous: Drone[]): DroneSocketEvent[] => {
  const updated = previous.map((drone) => {
    const nextSpeed = Math.max(3, drone.speedMps + (Math.random() - 0.5) * 2.1);
    return {
      ...drone,
      lat: drone.lat + drift(),
      lon: drone.lon + drift(),
      altitudeM: Math.max(20, drone.altitudeM + Math.round((Math.random() - 0.5) * 4)),
      speedMps: Number(nextSpeed.toFixed(1)),
      headingDeg: Math.round((drone.headingDeg + (Math.random() - 0.5) * 18 + 360) % 360),
      updatedAt: new Date().toISOString(),
      status: nextSpeed > 13.6 ? "warning" : "online"
    } as Drone;
  });

  const events: DroneSocketEvent[] = updated.map((drone) => ({
    version: 1,
    type: "drone.position",
    timestamp: new Date().toISOString(),
    payload: { drone }
  }));

  if (Math.random() > 0.72) {
    events.push({
      version: 1,
      type: "notification.created",
      timestamp: new Date().toISOString(),
      payload: { notification: randomNotification() }
    });
  }

  return events;
};

export const mockInitialDrones = (): Drone[] => baseDrones;
