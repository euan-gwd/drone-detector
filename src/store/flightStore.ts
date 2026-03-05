import { create } from "zustand";
import type { FlightApproval } from "../types/drone";

interface FlightStore {
  approvals: FlightApproval[];
  busyAction: string | null;
  seedApprovals: (items: FlightApproval[]) => void;
  runAction: (action: "view" | "end-plan" | "land" | "end-flight") => Promise<void>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useFlightStore = create<FlightStore>((set) => ({
  approvals: [],
  busyAction: null,
  seedApprovals: (items) => set({ approvals: items }),
  runAction: async (action) => {
    set({ busyAction: action });
    await wait(900);
    set({ busyAction: null });
  }
}));
