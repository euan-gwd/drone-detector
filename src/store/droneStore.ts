import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Drone } from "../types/drone";

interface DroneStore {
  drones: Record<string, Drone>;
  selectedDroneId: string | null;
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
      upsertDrone: (drone) =>
        set((state) => {
          const current = state.drones[drone.id];
          const controlledStatus = state.controlStatusByDrone[drone.id];
          const isLanded = controlledStatus === "offline";

          const nextDrone: Drone = {
            ...drone,
            status: controlledStatus ?? drone.status
          };

          if (isLanded) {
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
            },
            selectedDroneId: state.selectedDroneId ?? drone.id
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
      setControlStatus: (id, status) =>
        set((state) => {
          const nextControls = { ...state.controlStatusByDrone };
          if (status === null) {
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
      partialize: (state) => ({
        selectedDroneId: state.selectedDroneId,
        controlStatusByDrone: state.controlStatusByDrone
      })
    }
  )
);
