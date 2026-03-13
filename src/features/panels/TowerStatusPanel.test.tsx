import { render, screen, fireEvent } from "@testing-library/react";
import TowerStatusPanel from "./TowerStatusPanel";
import { useTowerStore } from "../../store/towerStore";
import type { SensorTower } from "../../types/sensorTower";

const makeTower = (id: string, overrides?: Partial<SensorTower>): SensorTower => ({
  id,
  name: `Tower ${id}`,
  lat: 51.5,
  lon: -1.2,
  altitudeM: 40,
  status: "online",
  range: 4500,
  updatedAt: new Date().toISOString(),
  sensors: [
    {
      id: `${id}-sensor-radar`,
      towerId: id,
      type: "radar",
      status: "active",
      signalStrength: 0.85,
      lastDetection: null,
    },
    {
      id: `${id}-sensor-lidar`,
      towerId: id,
      type: "lidar",
      status: "inactive",
      signalStrength: 0.7,
      lastDetection: null,
    },
  ],
  cameras: [
    {
      id: `${id}-cam-1`,
      towerId: id,
      name: "North Cam",
      azimuth: 0,
      elevation: 5,
      fieldOfView: 65,
      zoom: 1,
      status: "active",
      updatedAt: new Date().toISOString(),
    },
    {
      id: `${id}-cam-2`,
      towerId: id,
      name: "South Cam",
      azimuth: 180,
      elevation: 5,
      fieldOfView: 65,
      zoom: 1,
      status: "inactive",
      updatedAt: new Date().toISOString(),
    },
  ],
  ...overrides,
});

describe("TowerStatusPanel", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useTowerStore.setState({
      towers: {},
      selectedTowerId: null,
      controlStatusByTower: {},
      detectionsByTower: {},
      cameraStatesByTower: {},
    });
  });

  it("renders the panel header", () => {
    render(<TowerStatusPanel />);
    expect(screen.getByText("Tower Status")).toBeInTheDocument();
  });

  it("shows empty state when there are no towers", () => {
    render(<TowerStatusPanel />);
    expect(screen.getByText("No towers available.")).toBeInTheDocument();
  });

  it("shows compact tower list and context prompt when no tower is selected", () => {
    useTowerStore.setState({
      towers: {
        "twr-1": makeTower("twr-1", { name: "Tower Alpha", status: "online" }),
      },
      selectedTowerId: null,
    });

    render(<TowerStatusPanel />);

    expect(screen.getByText("Tower Alpha")).toBeInTheDocument();
    expect(screen.getByText("online")).toBeInTheDocument();
    expect(screen.getByText("Select a tower from the list to inspect tower details.")).toBeInTheDocument();
    expect(screen.queryByText("North Cam")).not.toBeInTheDocument();
    expect(screen.queryByText("Sensors")).not.toBeInTheDocument();
  });

  it("selects a tower and shows context-aware details for that tower", () => {
    useTowerStore.setState({
      towers: {
        "twr-1": makeTower("twr-1", { name: "Tower Alpha", range: 4500 }),
        "twr-2": makeTower("twr-2", { name: "Tower Bravo", status: "offline", range: 3000 }),
      },
      selectedTowerId: null,
    });

    render(<TowerStatusPanel />);

    fireEvent.click(screen.getByRole("button", { name: /tower alpha/i }));

    expect(useTowerStore.getState().selectedTowerId).toBe("twr-1");
    expect(screen.getByText("Tower Details")).toBeInTheDocument();
    expect(screen.getByText("Cameras")).toBeInTheDocument();
    expect(screen.getByText("1/2 online")).toBeInTheDocument();
    expect(screen.getByText("North Cam")).toBeInTheDocument();
    expect(screen.getByText("South Cam")).toBeInTheDocument();
    expect(screen.getByText("Sensors")).toBeInTheDocument();
    expect(screen.getByText("radar")).toBeInTheDocument();
    expect(screen.getByText("lidar")).toBeInTheDocument();
    expect(screen.queryByText("Detections:")).not.toBeInTheDocument();
    expect(screen.queryByText("Detection range:")).not.toBeInTheDocument();
  });

  it("honors pre-selected tower from map and shows matching details", () => {
    useTowerStore.setState({
      towers: {
        "twr-1": makeTower("twr-1", { name: "Tower Alpha" }),
        "twr-2": makeTower("twr-2", { name: "Tower Bravo", range: 3000, sensors: [], cameras: [] }),
      },
      selectedTowerId: "twr-2",
    });

    render(<TowerStatusPanel />);

    expect(screen.getByText("Tower Bravo")).toBeInTheDocument();
    expect(screen.getByText("Cameras:")).toBeInTheDocument();
    expect(screen.getByText("Sensors:")).toBeInTheDocument();
    expect(screen.getAllByText("0/0 online")).toHaveLength(2);
  });
});
