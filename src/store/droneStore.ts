import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Drone } from "../types/drone";

interface DroneStore {
  drones: Record<string, Drone>;
  selectedDroneId: string | null;
  /**
   * Operator-commanded status overrides, keyed by drone ID.
   *
   * When a user issues a "land" or "takeoff" command the UI writes a status here.
   * This value takes **precedence over any status received from the server** so
   * the map and panels immediately reflect the operator intent, even if the
   * server hasn't acknowledged the command yet.
   *
   * Cleared (key deleted) when control is returned to automatic (e.g. after
   * a flight plan ends).
   *
    * Persisted to sessionStorage so in-progress control states survive a page
   * refresh (see `partialize` in the persist config below).
   */
  controlStatusByDrone: Record<string, Drone["status"]>;
  upsertDrone: (drone: Drone) => void;
  updateDroneStatus: (id: string, status: Drone["status"]) => void;
  setControlStatus: (id: string, status: Drone["status"] | null) => void;
  selectDrone: (id: string | null) => void;
}

export const useDroneStore = create<DroneStore>()(
  persist(
    (set) => ({
      drones: {},
      selectedDroneId: null,
      controlStatusByDrone: {},
      /**
       * Merges an incoming drone update from the WebSocket into the store.
       *
        * Invariants:
        * 1. A control override (`controlStatusByDrone[drone.id]`) always takes
        *    precedence over server-reported status.
        * 2. When commanded "offline", movement fields are frozen and altitude/speed
        *    are forced to zero so landed drones do not drift on the map.
       */
      upsertDrone: (drone) =>
        set((state) => {
          const current = state.drones[drone.id];
          const controlledStatus = state.controlStatusByDrone[drone.id];
          // Control override always wins over server status.
          const isLanded = controlledStatus === "offline";

          const nextDrone: Drone = {
            ...drone,
            status: controlledStatus ?? drone.status
          };

          if (isLanded) {
            // Keep landed drones visually stationary.
            nextDrone.lat = current?.lat ?? drone.lat;
            nextDrone.lon = current?.lon ?? drone.lon;
            nextDrone.altitudeM = 0;
            nextDrone.speedMps = 0;
            nextDrone.headingDeg = current?.headingDeg ?? drone.headingDeg;
          }

          return {
            drones: {
              ...state.drones,
              [drone.id]: nextDrone
            }
          };
        }),
      updateDroneStatus: (id, status) =>
        set((state) => {
          const current = state.drones[id];
          if (!current) {
            return state;
          }
          const controlledStatus = state.controlStatusByDrone[id];
          return {
            drones: {
              ...state.drones,
              [id]: {
                ...current,
                status: controlledStatus ?? status,
                updatedAt: new Date().toISOString()
              }
            }
          };
        }),
      /**
       * Sets or clears the operator-commanded status for a specific drone.
       *
       * Pass `null` to remove the override and hand control back to the server
       * (the next incoming telemetry message will then set the drone's status).
       *
       * Also immediately updates the drone record in `state.drones` so the UI
       * reflects the new command without waiting for the next WebSocket tick.
       * When commanding "offline" (land), altitude and speed are zeroed instantly.
       */
      setControlStatus: (id, status) =>
        set((state) => {
          const nextControls = { ...state.controlStatusByDrone };
          if (status === null) {
            // Remove override so the next server update controls status again.
            delete nextControls[id];
          } else {
            nextControls[id] = status;
          }

          const current = state.drones[id];
          return {
            controlStatusByDrone: nextControls,
            drones: current
              ? {
                  ...state.drones,
                  [id]: {
                    ...current,
                    status: status ?? current.status,
                    altitudeM: status === "offline" ? 0 : current.altitudeM,
                    speedMps: status === "offline" ? 0 : current.speedMps,
                    updatedAt: new Date().toISOString()
                  }
                }
              : state.drones
          };
        }),
      selectDrone: (id) => set({ selectedDroneId: id })
    }),
    {
      name: "drone-control-store",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      /**
       * Strips any `selectedDroneId` left behind by an older persisted snapshot.
       * The selected drone is transient UI state — it shouldn't survive a page
       * refresh so it was removed from `partialize`, but old snapshots may still
       * contain it. Deleting it here keeps the migration clean.
       */
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown>;
        delete state.selectedDroneId;
        return state;
      },
      // Persist only control overrides; all other state is rebuilt from telemetry.
      partialize: (state) => ({
        controlStatusByDrone: state.controlStatusByDrone
      })
    }
  )
);
