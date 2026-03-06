import { render, screen, fireEvent } from "@testing-library/react";
import DroneStatusPanel from "./DroneStatusPanel";
import { useDroneStore } from "../../store/droneStore";
import type { Drone } from "../../types/drone";

const makeDrone = (id: string, overrides?: Partial<Drone>): Drone => ({
  id,
  name: "Test Drone",
  lat: 51.5,
  lon: -1.2,
  altitudeM: 120,
  speedMps: 12,
  headingDeg: 90,
  updatedAt: new Date().toISOString(),
  status: "online",
  ...overrides,
});

describe("DroneStatusPanel", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useDroneStore.setState({ drones: {}, selectedDroneId: null, controlStatusByDrone: {} });
  });

  it("renders the panel header", () => {
    render(<DroneStatusPanel />);
    expect(screen.getByText("Drone Status")).toBeInTheDocument();
  });

  it("shows active drone count when no drone is selected", () => {
    useDroneStore.setState({
      drones: {
        "drn-1": makeDrone("drn-1", { status: "online" }),
        "drn-2": makeDrone("drn-2", { status: "warning" }),
        "drn-3": makeDrone("drn-3", { status: "offline" }),
      },
    });
    render(<DroneStatusPanel />);
    // 2 active (online + warning), 1 offline
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/active drone/)).toBeInTheDocument();
  });

  it("renders singular 'drone' when only one is active", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "online" }) },
    });
    render(<DroneStatusPanel />);
    expect(screen.getByText(/active drone tracked/)).toBeInTheDocument();
    // Should NOT contain the plural form "drones"
    expect(screen.queryByText(/active drones tracked/)).not.toBeInTheDocument();
  });

  it("shows a prompt to select a drone when none is selected", () => {
    render(<DroneStatusPanel />);
    expect(screen.getByText(/Select a drone/)).toBeInTheDocument();
  });

  it("renders selected drone details", () => {
    useDroneStore.setState({
      drones: {
        "drn-1": makeDrone("drn-1", { name: "Sky Eye", speedMps: 15, altitudeM: 200, headingDeg: 270 }),
      },
      selectedDroneId: "drn-1",
    });
    render(<DroneStatusPanel />);
    expect(screen.getByText("Sky Eye")).toBeInTheDocument();
    expect(screen.getByText("drn-1")).toBeInTheDocument();
    expect(screen.getByText("15 m/s")).toBeInTheDocument();
    expect(screen.getByText("200 m")).toBeInTheDocument();
    expect(screen.getByText("270°")).toBeInTheDocument();
  });

  it("capitalises the drone status in the detail view", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "warning" }) },
      selectedDroneId: "drn-1",
    });
    render(<DroneStatusPanel />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("collapses when the header is clicked", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { name: "Hidden Drone" }) },
      selectedDroneId: "drn-1",
    });
    render(<DroneStatusPanel />);
    fireEvent.click(screen.getByText("Drone Status"));
    expect(screen.queryByText("Hidden Drone")).not.toBeInTheDocument();
  });

  it("re-expands after being collapsed", () => {
    render(<DroneStatusPanel />);
    const header = screen.getByText("Drone Status");
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.getByText(/Select a drone/)).toBeInTheDocument();
  });
});
