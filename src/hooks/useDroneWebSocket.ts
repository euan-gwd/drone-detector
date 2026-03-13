import { useEffect } from "react";
import { DroneSocketClient } from "../services/websocketClient";
import { useDroneStore } from "../store/droneStore";
import { useTowerStore } from "../store/towerStore";
import { useNotificationStore } from "../store/notificationStore";
import { useUiStore } from "../store/uiStore";

// Module-level singleton: all hook users share one client connection.
const client = new DroneSocketClient();

/**
 * Subscribes to the drone and tower WebSocket feed and fans out each event to the
 * relevant Zustand store action.
 *
 * Call this once at app root. Multiple mounts are safe but redundant because
 * each subscription would process every incoming event.
 */
export const useSystemWebSocket = (): void => {
  const upsertDrone = useDroneStore((state) => state.upsertDrone);
  const updateDroneStatus = useDroneStore((state) => state.updateDroneStatus);
  const upsertTower = useTowerStore((state) => state.upsertTower);
  const updateTowerStatus = useTowerStore((state) => state.updateTowerStatus);
  const addDetection = useTowerStore((state) => state.addDetection);
  const updateCameraState = useTowerStore((state) => state.updateCameraState);
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

      if (event.type === "tower.position") {
        upsertTower(event.payload.tower);
        return;
      }

      if (event.type === "tower.status") {
        updateTowerStatus(event.payload.id, event.payload.status);
        return;
      }

      if (event.type === "tower.detection") {
        addDetection(event.payload.detection);
        return;
      }

      if (event.type === "tower.camera") {
        updateCameraState(event.payload.towerId, event.payload.camera);
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
  }, [addNotification, setConnected, updateDroneStatus, upsertDrone, upsertTower, updateTowerStatus, addDetection, updateCameraState]);
};

// Backward compatibility export - will be removed once components are updated
export const useDroneWebSocket = useSystemWebSocket;
