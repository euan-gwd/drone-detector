import { create } from "zustand";

interface UiStore {
  connected: boolean;
  showRangeMarkers: boolean;
  setConnected: (connected: boolean) => void;
  setShowRangeMarkers: (show: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  connected: false,
  showRangeMarkers: false, // Default to hidden for cleaner map view
  setConnected: (connected) => set({ connected }),
  setShowRangeMarkers: (showRangeMarkers) => set({ showRangeMarkers })
}));
