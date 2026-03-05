import { create } from "zustand";
import type { Drone } from "../types/drone";

interface DroneStore {
  drones: Record<string, Drone>;
  selectedDroneId: string | null;
  upsertDrone: (drone: Drone) => void;
  updateDroneStatus: (id: string, status: Drone["status"]) => void;
  selectDrone: (id: string | null) => void;
}

export const useDroneStore = create<DroneStore>((set) => ({
  drones: {},
  selectedDroneId: null,
  upsertDrone: (drone) =>
    set((state) => ({
      drones: { ...state.drones, [drone.id]: drone }
    })),
  updateDroneStatus: (id, status) =>
    set((state) => {
      const current = state.drones[id];
      if (!current) {
        return state;
      }
      return {
        drones: {
          ...state.drones,
          [id]: { ...current, status, updatedAt: new Date().toISOString() }
        }
      };
    }),
  selectDrone: (id) => set({ selectedDroneId: id })
}));
