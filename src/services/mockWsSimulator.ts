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

const drift = () => (Math.random() - 0.5) * 0.0026;

const makeNotification = (drone: Drone, level: NotificationItem["level"]): NotificationItem => {
  const label = `${drone.name} (${drone.id})`;
  const messages: Record<NotificationItem["level"], { title: string; message: string }> = {
    warning: {
      title: "Speed caution",
      message: `${label} has entered the caution speed band at ${drone.speedMps.toFixed(1)} m/s`
    },
    info: {
      title: "Flight update",
      message: `${label} flight plan remains approved and active`
    },
    success: {
      title: "Status nominal",
      message: `${label} has returned to normal operating parameters`
    },
    error: {
      title: "Flight error",
      message: `${label} reported an unexpected error — review required`
    }
  };

  return {
    id: `notif-${crypto.randomUUID()}`,
    level,
    title: messages[level].title,
    message: messages[level].message,
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
