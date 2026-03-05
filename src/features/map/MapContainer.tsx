import { useEffect, useMemo, useRef, useTransition } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { useDroneStore } from "../../store/droneStore";
import { useFlightStore } from "../../store/flightStore";
import { syncDroneFeatures } from "./mapLayers";

const mapCenter = fromLonLat([-0.56, 51.86]);

function MapContainer(): JSX.Element {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const droneLayerSource = useMemo(() => new VectorSource(), []);
  const drones = useDroneStore((state) => state.drones);
  const selectedDroneId = useDroneStore((state) => state.selectedDroneId);
  const selectDrone = useDroneStore((state) => state.selectDrone);
  const approvals = useFlightStore((state) => state.approvals);
  const [, startTransition] = useTransition();

  const approvalStatusByDrone = useMemo(() => {
    return approvals.reduce<Record<string, (typeof approvals)[number]["status"]>>((acc, item) => {
      acc[item.aircraftId] = item.status;
      return acc;
    }, {});
  }, [approvals]);

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

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [droneLayerSource, selectDrone]);

  useEffect(() => {
    syncDroneFeatures(droneLayerSource, drones, selectedDroneId, approvalStatusByDrone);
  }, [droneLayerSource, drones, selectedDroneId, approvalStatusByDrone]);

  return <div ref={mapRef} className="h-full w-full" aria-label="Live drone map" />;
}

export default MapContainer;
