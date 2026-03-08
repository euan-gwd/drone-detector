import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import { Icon, Style } from "ol/style";
import { syncDroneFeatures } from "./mapLayers";
import type { Drone, FlightApproval } from "../../types/drone";

const makeDrone = (id: string, status: Drone["status"]): Drone => ({
  id,
  name: `Drone ${id}`,
  lat: 51.5,
  lon: -1.2,
  altitudeM: 100,
  speedMps: 10,
  headingDeg: 90,
  updatedAt: new Date().toISOString(),
  status,
});

const getDecodedIconSvg = (source: VectorSource, droneId: string): string => {
  const feature = source.getFeatureById(`drone-${droneId}`);
  expect(feature).toBeInstanceOf(Feature);
  expect(feature?.getGeometry()).toBeInstanceOf(Point);

  const style = feature?.getStyle();
  expect(style).toBeInstanceOf(Style);

  const image = (style as Style).getImage();
  expect(image).toBeInstanceOf(Icon);

  const src = (image as Icon).getSrc();
  expect(src).toContain("data:image/svg+xml;charset=utf-8,");

  return decodeURIComponent(src!.replace("data:image/svg+xml;charset=utf-8,", ""));
};

const runSync = (
  status: Drone["status"],
  approvalStatus?: FlightApproval["status"],
): string => {
  const source = new VectorSource();
  const drone = makeDrone("drn-1", status);
  syncDroneFeatures(source, { [drone.id]: drone }, null, approvalStatus ? { [drone.id]: approvalStatus } : {});
  return getDecodedIconSvg(source, drone.id);
};

describe("syncDroneFeatures marker fillColor", () => {
  it("uses green for online when there is no flight approval override", () => {
    const svg = runSync("online");
    expect(svg).toContain('fill="#1aba56"');
  });

  it("uses yellow for warning when there is no flight approval override", () => {
    const svg = runSync("warning");
    expect(svg).toContain('fill="#facc15"');
  });

  it("uses orange when approval is pending and status is not offline", () => {
    const svg = runSync("online", "pending");
    expect(svg).toContain('fill="#fb923c"');
  });

  it("uses red when approval is actionrequired and status is not offline", () => {
    const svg = runSync("online", "actionrequired");
    expect(svg).toContain('fill="#ef4444"');
  });

  it("uses white when status is offline and approval is pending", () => {
    const svg = runSync("offline", "pending");
    expect(svg).toContain('fill="#ffffff"');
  });

  it("uses red when status is offline and approval is actionrequired", () => {
    const svg = runSync("offline", "actionrequired");
    expect(svg).toContain('fill="#ef4444"');
  });

  it("uses blue when status is offline and approval is approved", () => {
    const svg = runSync("offline", "approved");
    expect(svg).toContain('fill="#38bdf8"');
  });

  it("uses green when status is online and approval is approved", () => {
    const svg = runSync("online", "approved");
    expect(svg).toContain('fill="#1aba56"');
  });

  it("uses yellow when status is warning and approval is approved", () => {
    const svg = runSync("warning", "approved");
    expect(svg).toContain('fill="#facc15"');
  });
});
