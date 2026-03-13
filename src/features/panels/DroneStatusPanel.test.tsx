import { render, screen, fireEvent } from "@testing-library/react";
import DroneStatusPanel from "./DroneStatusPanel";
import { useDroneStore } from "../../store/droneStore";
import { useFlightStore } from "../../store/flightStore";
import type { FlightApproval } from "../../types/drone";
import type { Drone } from "../../types/drone";

// Panel includes summary + drone list and selected-drone flight controls.

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

const makeApproval = (aircraftId: string, overrides?: Partial<FlightApproval>): FlightApproval => ({
  id: "A001",
  aircraftId,
  status: "approved",
  startedAt: new Date().toISOString(),
  planStartedAt: new Date().toISOString(),
  comments: "",
  ...overrides,
});

describe("DroneStatusPanel", () => {
  beforeEach(() => {
    // Only drones is used by this panel; reset to a clean slate each test.
    useDroneStore.setState({ drones: {}, selectedDroneId: null, controlStatusByDrone: {} });
    useFlightStore.setState({ approvals: [], busyAction: null });
  });

  it("renders the panel header", () => {
    render(<DroneStatusPanel />);
    expect(screen.getByText("Drone Status")).toBeInTheDocument();
  });

  it("shows active drone count", () => {
    useDroneStore.setState({
      drones: {
        "drn-1": makeDrone("drn-1", { status: "online" }),
        "drn-2": makeDrone("drn-2", { status: "warning" }),
        "drn-3": makeDrone("drn-3", { status: "offline" }),
      },
    });
    render(<DroneStatusPanel />);
    expect(screen.getByText("Total drones:")).toBeInTheDocument();
    expect(screen.getByText("Online:")).toBeInTheDocument();
    expect(screen.getByText("Warning:")).toBeInTheDocument();
    expect(screen.getByText("Offline:")).toBeInTheDocument();
  });

  it("shows empty state when there are no drones", () => {
    render(<DroneStatusPanel />);
    expect(screen.getByText("No drones available.")).toBeInTheDocument();
  });

  it("prompts for selection before showing flight controls", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { id: "drn-1", name: "Drone 1", status: "offline" }) },
    });

    render(<DroneStatusPanel />);
    expect(screen.getByText("Select a drone on the map or from the list to use flight controls.")).toBeInTheDocument();
  });

  it("shows 'Request Approval' for the selected pending drone", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { id: "drn-1", name: "Drone 1", status: "offline" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1", { status: "pending" })] });

    render(<DroneStatusPanel />);
    expect(screen.getByRole("button", { name: /request approval/i })).toBeInTheDocument();
  });

  it("shows 'Land' when selected drone is airborne with approved plan", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "online" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1", { status: "approved" })] });

    render(<DroneStatusPanel />);
    expect(screen.getByRole("button", { name: /^land$/i })).not.toBeDisabled();
  });

  it("shows 'Take Off' when selected drone is landed with approved plan", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "offline" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1", { status: "approved" })] });

    render(<DroneStatusPanel />);
    expect(screen.getByRole("button", { name: /take off/i })).not.toBeDisabled();
  });

  it("selects a drone from the list in the side panel", () => {
    useDroneStore.setState({
      drones: {
        "drn-1": makeDrone("drn-1", { id: "drn-1", name: "Alpha" }),
        "drn-2": makeDrone("drn-2", { id: "drn-2", name: "Bravo" }),
      },
      selectedDroneId: null,
    });

    render(<DroneStatusPanel />);
    fireEvent.click(screen.getByRole("button", { name: /bravo/i }));

    expect(useDroneStore.getState().selectedDroneId).toBe("drn-2");
  });

  it("honors map selection by showing controls for pre-selected drone", () => {
    useDroneStore.setState({
      drones: {
        "drn-1": makeDrone("drn-1", { id: "drn-1", name: "Alpha", status: "offline" }),
        "drn-2": makeDrone("drn-2", { id: "drn-2", name: "Bravo", status: "online" }),
      },
      selectedDroneId: "drn-2",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-2", { status: "approved" })] });

    render(<DroneStatusPanel />);

    expect(screen.getByText("Aircraft:")).toBeInTheDocument();
    expect(screen.getByText("Bravo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^land$/i })).toBeInTheDocument();
  });

  it("collapses the body when the header is clicked", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1") },
    });
    render(<DroneStatusPanel />);
    expect(screen.getByText("Drone List")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Drone Status"));

    expect(screen.queryByText("Drone List")).not.toBeInTheDocument();
  });

  it("re-expands after being collapsed", () => {
    render(<DroneStatusPanel />);
    const header = screen.getByText("Drone Status");
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.getByText("No drones available.")).toBeInTheDocument();
  });
});
