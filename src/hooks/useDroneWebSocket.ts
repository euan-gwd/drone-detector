import { useEffect } from "react";
import { DroneSocketClient } from "../services/websocketClient";
import { useDroneStore } from "../store/droneStore";
import { useNotificationStore } from "../store/notificationStore";
import { useUiStore } from "../store/uiStore";

// Singleton: one shared client instance for the whole app.
// Any component that calls useDroneWebSocket() subscribes to this same client;
// multiple mounts won't open multiple connections — they just add subscribers.
const client = new DroneSocketClient();

/**
 * Subscribes to the drone WebSocket feed and fans out each event to the
 * relevant Zustand store action.
 *
 * Call this hook once at the app root (e.g. inside App.tsx). Mounting it in
 * multiple components is safe because the client is a module-level singleton,
 * but redundant subscriptions would process every event more than once.
 */
export const useDroneWebSocket = (): void => {
  const upsertDrone = useDroneStore((state) => state.upsertDrone);
  const updateDroneStatus = useDroneStore((state) => state.updateDroneStatus);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const setConnected = useUiStore((state) => state.setConnected);

  useEffect(() => {
    // Register this component's handlers with the client
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
      // Remove this component's subscriber when it unmounts.
      // client.stop() halts the polling interval; safe to call if already stopped.
      unsubscribe();
      client.stop();
    };
    // All four deps are Zustand store selectors. Zustand guarantees they are
    // stable references across renders, so this effect runs only on first mount.
  }, [addNotification, setConnected, updateDroneStatus, upsertDrone]);
};
