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
  // popupContainerRef is the DOM node that OpenLayers will physically move
  // around the map canvas to keep it above the selected drone icon.
  const popupContainerRef = useRef<HTMLDivElement | null>(null);
  // popupOverlayRef stores the OL Overlay instance so the position-sync
  // effect can update it without triggering a re-render.
  const popupOverlayRef = useRef<Overlay | null>(null);
  // React Compiler automatically memoises this stable OL source instance.
  const droneLayerSource = new VectorSource();
  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const selectDrone = useDroneStore((state) => state.selectDrone);
  const approvals = useFlightStore((state) => state.approvals);
  const [, startTransition] = useTransition();

  // Derive the selected drone object directly — the React Compiler will
  // automatically memoise this so it only recomputes when drones or
  // selectedDroneId actually change. No useMemo() needed.
  const selectedDrone = selectedDroneId ? (drones[selectedDroneId] ?? null) : null;

  // handleClose is called by the popup's X button.
  // We wrap selectDrone(null) in startTransition so React treats the
  // deselection as a non-urgent update — the same pattern used in the
  // map click handler below, keeping map interactions responsive.
  function handleClose() {
    startTransition(() => {
      selectDrone(null);
    });
  }

  // React Compiler automatically memoises this — no useMemo() needed.
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

      // Mark as non-urgent to keep map interactions responsive
      startTransition(() => {
        selectDrone(selectedId);
      });
    });

    // ── OpenLayers Overlay for the drone popup ──────────────────────────────
    //
    // An OL Overlay is a DOM element that OL positions on the map canvas at a
    // given coordinate. We pass our popupContainerRef div as the element so
    // React controls what's rendered inside it while OL controls where it sits.
    //
    // Key options explained:
    //   positioning: 'bottom-center' — OL aligns the bottom-centre of the div
    //     with the drone coordinate, so the arrow at the bottom of the popup
    //     points straight at the icon.
    //   stopEvent: true — mouse/touch events on the popup are NOT forwarded to
    //     the map. Without this, clicking the X button would also fire the map's
    //     click handler and immediately re-open (or close) the wrong drone.
    //   offset: [0, -28] — nudge 28px upward from the icon so the card doesn't
    //     overlap the drone marker itself.
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
      // Hide the overlay before destroying the map to avoid OL warnings
      // about updating a disposed overlay.
      popupOverlayRef.current?.setPosition(undefined);
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [droneLayerSource, selectDrone]);

  useEffect(() => {
    syncDroneFeatures(droneLayerSource, drones, selectedDroneId, approvalStatusByDrone);
  }, [droneLayerSource, drones, selectedDroneId, approvalStatusByDrone]);

  // ── Sync popup overlay position with live drone coordinates ───────────────
  //
  // `selectedDrone` is a new object reference on every 1.2 s telemetry tick,
  // so this effect fires automatically each tick and smoothly tracks the drone
  // as it drifts across the map.
  //
  // When no drone is selected, setPosition(undefined) tells OL to hide the
  // overlay (OL moves it off-screen rather than removing it from the DOM,
  // which avoids React unmount/remount overhead).
  useEffect(() => {
    const overlay = popupOverlayRef.current;
    if (!overlay) return;

    if (!selectedDrone) {
      // No selection — hide the popup
      overlay.setPosition(undefined);
      return;
    }

    // Move the popup to sit above the drone's current map position.
    // fromLonLat converts [longitude, latitude] (WGS-84) to the map's
    // internal projection (Web Mercator / EPSG:3857).
    overlay.setPosition(fromLonLat([selectedDrone.lon, selectedDrone.lat]));
  }, [selectedDrone]);

  return (
    // Relative positioning on the wrapper is required so OL can absolutely
    // position the overlay div within the map's coordinate space.
    <div className="relative h-full w-full">
      {/* The map canvas renders into this div */}
      <div ref={mapRef} className="h-full w-full" aria-label="Live drone map" />

      {/*
       * Popup container — OpenLayers moves this div around the canvas.
       * We render DronePopup inside it when a drone is selected.
       * When nothing is selected the div is empty and OL keeps it hidden
       * (setPosition(undefined) moves it off-screen).
       */}
      <div ref={popupContainerRef}>
        {selectedDrone && (
          <DronePopup drone={selectedDrone} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}

export default MapContainer;
