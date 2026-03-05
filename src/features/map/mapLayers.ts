import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import type { Drone, FlightApproval } from "../../types/drone";

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

  return new Style({
    image: new CircleStyle({
      radius: selected ? 8 : 6,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: "#f8fafc", width: selected ? 2.5 : 1.5 })
    })
  });
};

const featureId = (droneId: string) => `drone-${droneId}`;

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
    if (geometry instanceof Point) {
      geometry.setCoordinates(coordinate);
    }
    existing.setStyle(markerStyle(drone.status, selected, approvalStatus));
  });
};
