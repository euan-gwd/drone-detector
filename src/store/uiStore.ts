import { create } from "zustand";

interface UiStore {
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected })
}));
