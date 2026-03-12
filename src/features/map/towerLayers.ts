import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Circle from "ol/geom/Circle";
import Polygon from "ol/geom/Polygon";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { Icon, Style, Fill, Stroke, Text } from "ol/style";
import type { SensorTower, CameraState } from "../../types/sensorTower";
import { createTowerIconSvg, svgToDataUrl } from "./towerIcon";

const towerStyle = (
  status: SensorTower["status"],
  selected: boolean,
): Style => {
  let fillColor = status === "maintenance" ? "#fb923c" : status === "offline" ? "#64748b" : "#0ea5e9";

  if (status === "error") {
    fillColor = "#ef4444";
  }

  const svg = createTowerIconSvg(fillColor, selected);
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

const rangeRingStyle = (ringIndex: number, towerColor: string): Style => {
  const alpha = Math.max(0.1, 0.3 - (ringIndex * 0.05)); // Fade outer rings
  const strokeWidth = ringIndex === 0 ? 2 : 1; // Thicker inner ring

  return new Style({
    stroke: new Stroke({
      color: `${towerColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`,
      width: strokeWidth,
      lineDash: ringIndex % 2 === 0 ? undefined : [5, 5] // Alternate dashed/solid
    }),
    fill: new Fill({
      color: `${towerColor}${Math.round(alpha * 0.3 * 255).toString(16).padStart(2, '0')}`
    })
  });
};

const cameraFovStyle = (camera: CameraState): Style => {
  const cameraColor = camera.status === "active" ? "#10b981" : "#6b7280";

  return new Style({
    fill: new Fill({
      color: `${cameraColor}30` // 30 for ~20% opacity
    }),
    stroke: new Stroke({
      color: cameraColor,
      width: 2
    }),
    text: new Text({
      text: camera.name,
      font: "12px Arial",
      fill: new Fill({ color: "#ffffff" }),
      stroke: new Stroke({ color: "#000000", width: 2 }),
      offsetY: -10
    })
  });
};

// Feature ID conventions to match drone system patterns
const towerFeatureId = (towerId: string) => `tower-${towerId}`;
const rangeFeatureId = (towerId: string, ringIndex: number) => `range-${towerId}-${ringIndex}`;
const fovFeatureId = (towerId: string, cameraId: string) => `fov-${towerId}-${cameraId}`;

/**
 * Creates a circle segment (sector) geometry for camera field of view.
 * @param center Center coordinate in map projection
 * @param radius FOV radius in meters
 * @param azimuth Camera azimuth in degrees (0 = North)
 * @param fovAngle Field of view angle in degrees
 * @returns Polygon geometry representing the FOV sector
 */
const createFovSector = (
  center: number[],
  radius: number,
  azimuth: number,
  fovAngle: number
): Polygon => {
  const startAngle = ((azimuth - fovAngle / 2) * Math.PI) / 180;
  const endAngle = ((azimuth + fovAngle / 2) * Math.PI) / 180;
  const segments = 32; // Number of segments for smooth arc

  const coordinates = [center];

  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    const x = center[0] + radius * Math.sin(angle);
    const y = center[1] + radius * Math.cos(angle);
    coordinates.push([x, y]);
  }

  coordinates.push(center); // Close the sector

  return new Polygon([coordinates]);
};

/**
 * Synchronizes an OpenLayers VectorSource with the current tower state.
 *
 * Two-phase update following the drone pattern:
 * 1. Remove stale features - any feature whose ID is no longer in towers
 * 2. Create or update features - each tower gets a new or updated map feature
 */
export const syncTowerFeatures = (
  source: VectorSource,
  towers: Record<string, SensorTower>,
  selectedTowerId: string | null,
): void => {
  const incomingIds = new Set(Object.keys(towers));

  // Phase 1: Remove stale tower features
  source.getFeatures().forEach((feature) => {
    const featureId = String(feature.getId() ?? "");
    if (featureId.startsWith("tower-")) {
      const towerId = featureId.replace("tower-", "");
      if (!incomingIds.has(towerId)) {
        source.removeFeature(feature);
      }
    }
  });

  // Phase 2: Create or update tower features
  Object.values(towers).forEach((tower) => {
    const featureId = towerFeatureId(tower.id);
    const coordinate = fromLonLat([tower.lon, tower.lat]);
    const selected = selectedTowerId === tower.id;
    const existing = source.getFeatureById(featureId);

    if (!existing) {
      const feature = new Feature({
        geometry: new Point(coordinate),
        towerId: tower.id,
        towerName: tower.name
      });
      feature.setId(featureId);
      feature.setStyle(towerStyle(tower.status, selected));
      source.addFeature(feature);
      return;
    }

    // Update existing feature
    const geometry = existing.getGeometry();
    if (geometry instanceof Point) {
      geometry.setCoordinates(coordinate);
    }
    existing.set("towerName", tower.name);
    existing.setStyle(towerStyle(tower.status, selected));
  });
};

/**
 * Synchronizes range marker features with tower data.
 * Only shows range markers when enabled via UI toggle.
 */
export const syncRangeMarkers = (
  source: VectorSource,
  towers: Record<string, SensorTower>,
  showRangeMarkers: boolean,
): void => {
  const incomingIds = new Set(Object.keys(towers));

  // Remove stale range features
  source.getFeatures().forEach((feature) => {
    const featureId = String(feature.getId() ?? "");
    if (featureId.startsWith("range-")) {
      const towerId = featureId.split("-")[1];
      if (!incomingIds.has(towerId) || !showRangeMarkers) {
        source.removeFeature(feature);
      }
    }
  });

  if (!showRangeMarkers) {
    return; // Early exit if ranges are disabled
  }

  // Create or update range marker features
  Object.values(towers).forEach((tower) => {
    const center = fromLonLat([tower.lon, tower.lat]);
    const towerColor = tower.status === "maintenance" ? "#fb923c" :
                       tower.status === "offline" ? "#64748b" :
                       tower.status === "error" ? "#ef4444" : "#0ea5e9";

    // Create 5 range rings at 1km intervals
    for (let ring = 0; ring < 5; ring++) {
      const radius = (ring + 1) * 1000; // 1km, 2km, 3km, 4km, 5km
      const featureId = rangeFeatureId(tower.id, ring);
      const existing = source.getFeatureById(featureId);

      if (!existing) {
        const circle = new Circle(center, radius);
        const feature = new Feature({
          geometry: circle,
          towerId: tower.id,
          ringIndex: ring
        });
        feature.setId(featureId);
        feature.setStyle(rangeRingStyle(ring, towerColor));
        source.addFeature(feature);
      } else {
        // Update existing ring
        const geometry = existing.getGeometry();
        if (geometry instanceof Circle) {
          geometry.setCenter(center);
          geometry.setRadius(radius);
        }
        existing.setStyle(rangeRingStyle(ring, towerColor));
      }
    }
  });
};

/**
 * Synchronizes camera field-of-view features with real-time camera states.
 */
export const syncCameraFOV = (
  source: VectorSource,
  towers: Record<string, SensorTower>,
  cameraStates: Record<string, CameraState[]>,
): void => {
  const activeTowerIds = new Set(Object.keys(towers));

  // Remove stale FOV features
  source.getFeatures().forEach((feature) => {
    const featureId = String(feature.getId() ?? "");
    if (featureId.startsWith("fov-")) {
      const [, towerId] = featureId.split("-");
      if (!activeTowerIds.has(towerId)) {
        source.removeFeature(feature);
      }
    }
  });

  // Create or update FOV features
  Object.values(towers).forEach((tower) => {
    const cameras = cameraStates[tower.id] || tower.cameras || [];
    const center = fromLonLat([tower.lon, tower.lat]);

    cameras.forEach((camera) => {
      const featureId = fovFeatureId(tower.id, camera.id);
      const existing = source.getFeatureById(featureId);

      // Calculate FOV radius based on tower range and elevation
      const fovRadius = Math.min(tower.range, 2000); // Max 2km FOV display
      const fovSector = createFovSector(center, fovRadius, camera.azimuth, camera.fieldOfView);

      if (!existing) {
        const feature = new Feature({
          geometry: fovSector,
          towerId: tower.id,
          cameraId: camera.id,
          cameraName: camera.name
        });
        feature.setId(featureId);
        feature.setStyle(cameraFovStyle(camera));
        source.addFeature(feature);
      } else {
        // Update existing FOV
        existing.setGeometry(fovSector);
        existing.set("cameraName", camera.name);
        existing.setStyle(cameraFovStyle(camera));
      }
    });
  });
};