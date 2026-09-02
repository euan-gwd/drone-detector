import { create } from "zustand";
import type { MapStyle } from "../features/map/protomapsStyles";

interface UiStore {
  connected: boolean;
  showRangeMarkers: boolean;
  showCameraArcs: boolean;
  mapStyle: MapStyle;
  setConnected: (connected: boolean) => void;
  setShowRangeMarkers: (show: boolean) => void;
  setShowCameraArcs: (show: boolean) => void;
  setMapStyle: (style: MapStyle) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  connected: false,
  showRangeMarkers: false, // Default to hidden for cleaner map view
  showCameraArcs: false, // Default to hidden for cleaner map view
  mapStyle: "dark", // Matches the previous hardcoded Protomaps dark style
  setConnected: (connected) => set({ connected }),
  setShowRangeMarkers: (showRangeMarkers) => set({ showRangeMarkers }),
  setShowCameraArcs: (showCameraArcs) => set({ showCameraArcs }),
  setMapStyle: (mapStyle) => set({ mapStyle })
}));
