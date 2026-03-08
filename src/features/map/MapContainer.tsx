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
import { useFlightStore } from "../../store/flightStore";
import { syncDroneFeatures } from "./mapLayers";
import DronePopup from "./DronePopup";

const mapCenter = fromLonLat([-1.2577, 51.752]);

function MapContainer(): JSX.Element {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  // OpenLayers moves this DOM node to keep the popup above the selected marker.
  const popupContainerRef = useRef<HTMLDivElement | null>(null);
  // Keep Overlay instance in a ref so effects can update it without re-rendering.
  const popupOverlayRef = useRef<Overlay | null>(null);
  const droneLayerSource = new VectorSource();
  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const selectDrone = useDroneStore((state) => state.selectDrone);
  const approvals = useFlightStore((state) => state.approvals);
  const [, startTransition] = useTransition();

  const selectedDrone = selectedDroneId ? (drones[selectedDroneId] ?? null) : null;

  // Mark deselection as non-urgent to keep map interactions responsive.
  function handleClose() {
    startTransition(() => {
      selectDrone(null);
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

    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer, droneLayer],
      view: new View({
        center: mapCenter,
        zoom: 11
      }),
      controls: []
    });

    map.on("click", (event) => {
      let selectedId: string | null = null;

      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        selectedId = feature.get("droneId") ?? null;
      });

      // Mark as non-urgent to keep map interactions responsive.
      startTransition(() => {
        selectDrone(selectedId);
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
  }, [droneLayerSource, selectDrone]);

  useEffect(() => {
    syncDroneFeatures(droneLayerSource, drones, selectedDroneId, approvalStatusByDrone);
  }, [droneLayerSource, drones, selectedDroneId, approvalStatusByDrone]);

  // Keep the popup overlay in sync with the selected drone's latest coordinates.
  useEffect(() => {
    const overlay = popupOverlayRef.current;
    if (!overlay) return;

    if (!selectedDrone) {
      // No selection: hide the overlay.
      overlay.setPosition(undefined);
      return;
    }

    // Convert WGS-84 [lon, lat] to the map projection (EPSG:3857).
    overlay.setPosition(fromLonLat([selectedDrone.lon, selectedDrone.lat]));
  }, [selectedDrone]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" aria-label="Live drone map" />
      <div ref={popupContainerRef}>
        {selectedDrone && (
          <DronePopup
            drone={selectedDrone}
            approvalStatus={approvalStatusByDrone[selectedDrone.id]}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}

export default MapContainer;
