import { useEffect, useRef, useTransition, type JSX } from "react";
import Map from "ol/Map";
import Overlay from "ol/Overlay";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { useDroneStore } from "../../store/droneStore";
import { useTowerStore } from "../../store/towerStore";
import { useFlightStore } from "../../store/flightStore";
import { useUiStore } from "../../store/uiStore";
import { syncDroneFeatures } from "./mapLayers";
import { syncTowerFeatures, syncRangeMarkers, syncCameraFOV } from "./towerLayers";
import DronePopup from "./DronePopup";
import TowerPopup from "./TowerPopup";

const mapCenter = fromLonLat([-1.2577, 51.752]);

function MapContainer(): JSX.Element {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  // OpenLayers moves this DOM node to keep the popup above the selected marker.
  const popupContainerRef = useRef<HTMLDivElement | null>(null);
  // Keep Overlay instance in a ref so effects can update it without re-rendering.
  const popupOverlayRef = useRef<Overlay | null>(null);
  const droneLayerSourceRef = useRef<VectorSource | null>(null);
  const towerLayerSourceRef = useRef<VectorSource | null>(null);
  const rangeLayerSourceRef = useRef<VectorSource | null>(null);
  const fovLayerSourceRef = useRef<VectorSource | null>(null);

  if (!droneLayerSourceRef.current) {
    droneLayerSourceRef.current = new VectorSource();
  }

  if (!towerLayerSourceRef.current) {
    towerLayerSourceRef.current = new VectorSource();
  }

  if (!rangeLayerSourceRef.current) {
    rangeLayerSourceRef.current = new VectorSource();
  }

  if (!fovLayerSourceRef.current) {
    fovLayerSourceRef.current = new VectorSource();
  }

  const droneLayerSource = droneLayerSourceRef.current;
  const towerLayerSource = towerLayerSourceRef.current;
  const rangeLayerSource = rangeLayerSourceRef.current;
  const fovLayerSource = fovLayerSourceRef.current;

  // Drone state
  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const selectDrone = useDroneStore((state) => state.selectDrone);
  const approvals = useFlightStore((state) => state.approvals);

  // Tower state
  const towers = useTowerStore((state) => state.towers);
  const selectedTowerId = useTowerStore((state) => state.selectedTowerId);
  const selectTower = useTowerStore((state) => state.selectTower);
  const cameraStatesByTower = useTowerStore((state) => state.cameraStatesByTower);

  // UI state
  const showRangeMarkers = useUiStore((state) => state.showRangeMarkers);
  const showCameraArcs = useUiStore((state) => state.showCameraArcs);

  const [, startTransition] = useTransition();

  const selectedDrone = selectedDroneId ? (drones[selectedDroneId] ?? null) : null;
  const selectedTower = selectedTowerId ? (towers[selectedTowerId] ?? null) : null;

  // Mark deselection as non-urgent to keep map interactions responsive.
  function handleCloseDronePopup() {
    startTransition(() => {
      selectDrone(null);
    });
  }

  function handleCloseTowerPopup() {
    startTransition(() => {
      selectTower(null);
    });
  }

  const approvalStatusByDrone = approvals.reduce<Record<string, (typeof approvals)[number]["status"]>>(
    (acc, item) => {
      acc[item.aircraftId] = item.status;
      return acc;
    },
    {},
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: "https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      })
    });

    const droneLayer = new VectorLayer({
      source: droneLayerSource
    });

    const rangeLayer = new VectorLayer({
      source: rangeLayerSource
    });

    const towerLayer = new VectorLayer({
      source: towerLayerSource
    });

    const fovLayer = new VectorLayer({
      source: fovLayerSource
    });

    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer, rangeLayer, fovLayer, droneLayer, towerLayer], // Layer order: base, ranges, FOV, drones, towers (towers on top)
      view: new View({
        center: mapCenter,
        zoom: 11
      }),
      controls: []
    });

    map.on("click", (event) => {
      let selectedDroneId: string | null = null;
      let selectedTowerId: string | null = null;

      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        // Check for drone features first
        if (feature.get("droneId")) {
          selectedDroneId = feature.get("droneId");
          return true; // Stop iteration, drone takes priority
        }

        // Check for tower features
        if (feature.get("towerId") && !feature.getId()?.toString().startsWith("range-") && !feature.getId()?.toString().startsWith("fov-")) {
          // Only select actual tower markers, not range rings or FOV areas
          selectedTowerId = feature.get("towerId");
        }
      });

      // Mark as non-urgent to keep map interactions responsive.
      startTransition(() => {
        if (selectedDroneId) {
          selectDrone(selectedDroneId);
          selectTower(null); // Clear tower selection
        } else if (selectedTowerId) {
          selectTower(selectedTowerId);
          selectDrone(null); // Clear drone selection
        } else {
          // Clicked on empty space - clear all selections
          selectDrone(null);
          selectTower(null);
        }
      });
    });

    // Overlay options: position popup above the marker and keep popup clicks from
    // bubbling to the map (`stopEvent: true`) so close-button clicks do not trigger
    // feature selection underneath.
    if (popupContainerRef.current) {
      const overlay = new Overlay({
        element: popupContainerRef.current,
        positioning: "bottom-center",
        stopEvent: true,
        offset: [0, -28],
      });
      map.addOverlay(overlay);
      popupOverlayRef.current = overlay;
    }

    mapInstanceRef.current = map;

    return () => {
      // Hide before teardown to avoid updates against a disposed overlay.
      popupOverlayRef.current?.setPosition(undefined);
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [droneLayerSource, towerLayerSource, rangeLayerSource, fovLayerSource, selectDrone, selectTower]);

  // Sync drone features
  useEffect(() => {
    syncDroneFeatures(droneLayerSource, drones, selectedDroneId, approvalStatusByDrone);
  }, [droneLayerSource, drones, selectedDroneId, approvalStatusByDrone]);

  // Sync tower features
  useEffect(() => {
    syncTowerFeatures(towerLayerSource, towers, selectedTowerId);
  }, [towerLayerSource, towers, selectedTowerId]);

  // Sync range markers
  useEffect(() => {
    syncRangeMarkers(rangeLayerSource, towers, showRangeMarkers);
  }, [rangeLayerSource, towers, showRangeMarkers]);

  // Sync camera FOV
  useEffect(() => {
    syncCameraFOV(fovLayerSource, towers, cameraStatesByTower, showCameraArcs);
  }, [fovLayerSource, towers, cameraStatesByTower, showCameraArcs]);

  // Keep the popup overlay in sync with the selected entity's latest coordinates.
  useEffect(() => {
    const overlay = popupOverlayRef.current;
    if (!overlay) return;

    // Position based on selected entity (drone takes priority)
    const selectedEntity = selectedDrone || selectedTower;

    if (!selectedEntity) {
      // No selection: hide the overlay.
      overlay.setPosition(undefined);
      return;
    }

    // Convert WGS-84 [lon, lat] to the map projection (EPSG:3857).
    overlay.setPosition(fromLonLat([selectedEntity.lon, selectedEntity.lat]));
  }, [selectedDrone, selectedTower]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" aria-label="Live drone and tower map" />
      <div ref={popupContainerRef}>
        {selectedDrone && (
          <DronePopup
            drone={selectedDrone}
            approvalStatus={approvalStatusByDrone[selectedDrone.id]}
            onClose={handleCloseDronePopup}
          />
        )}
        {selectedTower && !selectedDrone && (
          <TowerPopup
            tower={selectedTower}
            onClose={handleCloseTowerPopup}
          />
        )}
      </div>
    </div>
  );
}

export default MapContainer;
