import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SensorTower, DetectionData, CameraState, TowerStatus } from "../types/sensorTower";

interface TowerStore {
  towers: Record<string, SensorTower>;
  selectedTowerId: string | null;
  /**
   * Operator-commanded status overrides, keyed by tower ID.
   *
   * When a user issues a "maintenance" or "take offline" command the UI writes a status here.
   * This value takes **precedence over any status received from the server** so
   * the map and panels immediately reflect the operator intent, even if the
   * server hasn't acknowledged the command yet.
   *
   * Cleared (key deleted) when control is returned to automatic.
   *
   * Persisted to sessionStorage so in-progress control states survive a page
   * refresh (see `partialize` in the persist config below).
   */
  controlStatusByTower: Record<string, TowerStatus>;
  /**
   * Recent detection data keyed by tower ID.
   * Automatically cleaned up to prevent memory bloat.
   */
  detectionsByTower: Record<string, DetectionData[]>;
  /**
   * Camera states for real-time FOV visualization.
   * Updated frequently as cameras move.
   */
  cameraStatesByTower: Record<string, CameraState[]>;
  upsertTower: (tower: SensorTower) => void;
  updateTowerStatus: (id: string, status: TowerStatus) => void;
  setControlStatus: (id: string, status: TowerStatus | null) => void;
  selectTower: (id: string | null) => void;
  addDetection: (detection: DetectionData) => void;
  updateCameraState: (towerId: string, camera: CameraState) => void;
  clearOldDetections: () => void;
}

// Keep detections for 5 minutes
const DETECTION_TTL = 5 * 60 * 1000;

export const useTowerStore = create<TowerStore>()(
  persist(
    (set, get) => ({
      towers: {},
      selectedTowerId: null,
      controlStatusByTower: {},
      detectionsByTower: {},
      cameraStatesByTower: {},
      /**
       * Merges an incoming tower update from the WebSocket into the store.
       *
       * Invariants:
       * 1. A control override (`controlStatusByTower[tower.id]`) always takes
       *    precedence over server-reported status.
       * 2. Sensor and camera data are updated from the tower payload.
       */
      upsertTower: (tower) =>
        set((state) => {
          const controlledStatus = state.controlStatusByTower[tower.id];

          const nextTower: SensorTower = {
            ...tower,
            status: controlledStatus ?? tower.status
          };

          // Update camera states if provided
          const updatedCameraStates = { ...state.cameraStatesByTower };
          if (tower.cameras && tower.cameras.length > 0) {
            updatedCameraStates[tower.id] = tower.cameras;
          }

          return {
            towers: {
              ...state.towers,
              [tower.id]: nextTower
            },
            cameraStatesByTower: updatedCameraStates
          };
        }),
      updateTowerStatus: (id, status) =>
        set((state) => {
          const current = state.towers[id];
          if (!current) {
            return state;
          }
          const controlledStatus = state.controlStatusByTower[id];
          return {
            towers: {
              ...state.towers,
              [id]: {
                ...current,
                status: controlledStatus ?? status,
                updatedAt: new Date().toISOString()
              }
            }
          };
        }),
      /**
       * Sets or clears the operator-commanded status for a specific tower.
       *
       * Pass `null` to remove the override and hand control back to the server
       * (the next incoming telemetry message will then set the tower's status).
       *
       * Also immediately updates the tower record in `state.towers` so the UI
       * reflects the new command without waiting for the next WebSocket tick.
       */
      setControlStatus: (id, status) =>
        set((state) => {
          const nextControls = { ...state.controlStatusByTower };
          if (status === null) {
            // Remove override so the next server update controls status again.
            delete nextControls[id];
          } else {
            nextControls[id] = status;
          }

          const current = state.towers[id];
          return {
            controlStatusByTower: nextControls,
            towers: current
              ? {
                  ...state.towers,
                  [id]: {
                    ...current,
                    status: status ?? current.status,
                    updatedAt: new Date().toISOString()
                  }
                }
              : state.towers
          };
        }),
      selectTower: (id) => set({ selectedTowerId: id }),
      /**
       * Adds a new detection to the tower's detection history.
       * Automatically triggers cleanup of old detections.
       */
      addDetection: (detection) =>
        set((state) => {
          const towerDetections = state.detectionsByTower[detection.towerId] || [];
          const updatedDetections = [detection, ...towerDetections].slice(0, 100); // Max 100 detections per tower

          const result = {
            detectionsByTower: {
              ...state.detectionsByTower,
              [detection.towerId]: updatedDetections
            }
          };

          // Trigger cleanup async to avoid blocking the update
          setTimeout(() => {
            get().clearOldDetections();
          }, 0);

          return result;
        }),
      /**
       * Updates camera state for real-time FOV visualization.
       */
      updateCameraState: (towerId, camera) =>
        set((state) => {
          const currentCameras = state.cameraStatesByTower[towerId] || [];
          const updatedCameras = currentCameras.map((cam) =>
            cam.id === camera.id ? camera : cam
          );

          // If camera not found, add it
          if (!currentCameras.find((cam) => cam.id === camera.id)) {
            updatedCameras.push(camera);
          }

          return {
            cameraStatesByTower: {
              ...state.cameraStatesByTower,
              [towerId]: updatedCameras
            }
          };
        }),
      /**
       * Removes detection data older than DETECTION_TTL.
       * Called automatically when new detections are added.
       */
      clearOldDetections: () =>
        set((state) => {
          const now = Date.now();
          const updatedDetections: Record<string, DetectionData[]> = {};

          Object.entries(state.detectionsByTower).forEach(([towerId, detections]) => {
            const recentDetections = detections.filter(
              (detection) => now - new Date(detection.timestamp).getTime() < DETECTION_TTL
            );
            if (recentDetections.length > 0) {
              updatedDetections[towerId] = recentDetections;
            }
          });

          return {
            detectionsByTower: updatedDetections
          };
        })
    }),
    {
      name: "tower-control-store",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      /**
       * Strips any transient UI state from persisted snapshots.
       * Selection and detection data shouldn't survive a page refresh.
       */
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown>;
        delete state.selectedTowerId;
        delete state.detectionsByTower;
        delete state.cameraStatesByTower;
        return state;
      },
      // Persist only control overrides; all other state is rebuilt from telemetry.
      partialize: (state) => ({
        controlStatusByTower: state.controlStatusByTower
      })
    }
  )
);