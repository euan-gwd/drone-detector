import { useEffect } from "react";
import { DroneSocketClient } from "../services/websocketClient";
import { useDroneStore } from "../store/droneStore";
import { useNotificationStore } from "../store/notificationStore";
import { useUiStore } from "../store/uiStore";

// Module-level singleton: all hook users share one client connection.
const client = new DroneSocketClient();

/**
 * Subscribes to the drone WebSocket feed and fans out each event to the
 * relevant Zustand store action.
 *
 * Call this once at app root. Multiple mounts are safe but redundant because
 * each subscription would process every incoming event.
 */
export const useDroneWebSocket = (): void => {
  const upsertDrone = useDroneStore((state) => state.upsertDrone);
  const updateDroneStatus = useDroneStore((state) => state.updateDroneStatus);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const setConnected = useUiStore((state) => state.setConnected);

  useEffect(() => {
    const unsubscribe = client.subscribe((event) => {
      if (event.type === "drone.position") {
        upsertDrone(event.payload.drone);
        return;
      }

      if (event.type === "drone.status") {
        updateDroneStatus(event.payload.id, event.payload.status);
        return;
      }

      if (event.type === "notification.created") {
        addNotification(event.payload.notification);
        return;
      }

      if (event.type === "connection.state") {
        setConnected(event.payload.connected);
      }
    });

    client.start();

    return () => {
      unsubscribe();
      client.stop();
    };
  }, [addNotification, setConnected, updateDroneStatus, upsertDrone]);
};
