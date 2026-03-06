import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { Icon, Style } from "ol/style";
import type { Drone, FlightApproval } from "../../types/drone";
import { createDroneIconSvg, svgToDataUrl } from "./droneIcon";

const markerStyle = (
  status: Drone["status"],
  selected: boolean,
  approvalStatus?: FlightApproval["status"]
): Style => {
  let fillColor = status === "warning" ? "#f59e0b" : status === "offline" ? "#ef4444" : "#38bdf8";

  if (approvalStatus === "pending") {
    fillColor = "#f59e0b";
  }

  if (approvalStatus === "actionrequired") {
    fillColor = "#ef4444";
  }

  const svg = createDroneIconSvg(fillColor, selected);
  const dataUrl = svgToDataUrl(svg);

  return new Style({
    image: new Icon({
      src: dataUrl,
      scale: 1,
      anchor: [0.5, 0.5],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction'
    })
  });
};

// Drone features in the vector source are identified by "drone-{droneId}".
// This convention lets us look up a specific drone's feature in O(1) without
// iterating the whole source.
const featureId = (droneId: string) => `drone-${droneId}`;

/**
 * Synchronises an OpenLayers VectorSource with the current drone state.
 *
 * This function is called on every Zustand store update that affects drones
 * (position change, selection change, approval status change). It performs a
 * two-phase update:
 *
 * 1. **Remove stale features** — any feature whose ID is no longer in
 *    `drones` is removed first. This handles drones that have gone offline.
 *
 * 2. **Create or update features** — each drone in `drones` either gets a
 *    new map feature or has its existing feature's geometry and style updated.
 *
 * The removal phase runs before the upsert phase so that if a drone ID were
 * ever reused (old drone removed, new drone assigned the same ID), there is
 * never a moment where two features share the same ID.
 */
export const syncDroneFeatures = (
  source: VectorSource,
  drones: Record<string, Drone>,
  selectedDroneId: string | null,
  approvalStatusByDrone: Record<string, FlightApproval["status"]>
): void => {
  const incomingIds = new Set(Object.keys(drones));

  source.getFeatures().forEach((feature) => {
    const id = String(feature.getId() ?? "");
    const droneId = id.replace("drone-", "");
    if (!incomingIds.has(droneId)) {
      source.removeFeature(feature);
    }
  });

  Object.values(drones).forEach((drone) => {
    const id = featureId(drone.id);
    const coordinate = fromLonLat([drone.lon, drone.lat]);
    const selected = selectedDroneId === drone.id;
    const approvalStatus = approvalStatusByDrone[drone.id];
    const existing = source.getFeatureById(id);

    if (!existing) {
      const feature = new Feature({
        geometry: new Point(coordinate),
        droneId: drone.id
      });
      feature.setId(id);
      feature.setStyle(markerStyle(drone.status, selected, approvalStatus));
      source.addFeature(feature);
      return;
    }

    const geometry = existing.getGeometry();
    // OpenLayers guarantees that drone features always have Point geometry
    // (we set it in the `new Feature({ geometry: new Point(...) })` call above).
    // The instanceof check is a safety guard to satisfy TypeScript's type narrowing;
    // if it ever fires for real, it indicates a bug in the feature creation path.
    if (geometry instanceof Point) {
      geometry.setCoordinates(coordinate);
    }
    existing.setStyle(markerStyle(drone.status, selected, approvalStatus));
  });
};
