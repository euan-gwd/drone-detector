import { render, screen, fireEvent } from "@testing-library/react";
import DroneStatusPanel from "./DroneStatusPanel";
import { useDroneStore } from "../../store/droneStore";
import type { Drone } from "../../types/drone";

// ── Notes on DroneStatusPanel behaviour ───────────────────────────────────
//
// Since the map popup now handles per-drone telemetry detail, this panel has
// been simplified to a status overview only. It always shows:
//   • A count of active (non-offline) drones
//   • A prompt directing the user to click a drone on the map
//
// Selected drone name, speed, altitude, heading, and status are no longer
// rendered here — see DronePopup.tsx and DronePopup.test.tsx for those tests.

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
    // Only drones is used by this panel; reset to a clean slate each test.
    useDroneStore.setState({ drones: {}, selectedDroneId: null, controlStatusByDrone: {} });
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
    // 2 active (online + warning), 1 offline — offline drones are excluded
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/active drone/)).toBeInTheDocument();
  });

  it("renders singular 'drone' when only one is active", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "online" }) },
    });
    render(<DroneStatusPanel />);
    expect(screen.getByText(/active drone tracked/)).toBeInTheDocument();
    expect(screen.queryByText(/active drones tracked/)).not.toBeInTheDocument();
  });

  it("shows a prompt directing the user to the map", () => {
    // The prompt is always visible (drone selection detail is shown in the
    // map popup, not here), so this holds regardless of selectedDroneId.
    render(<DroneStatusPanel />);
    expect(screen.getByText(/Select a drone/)).toBeInTheDocument();
  });

  it("collapses the body when the header is clicked", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1") },
    });
    render(<DroneStatusPanel />);
    // Confirm the prompt is visible before collapsing
    expect(screen.getByText(/Select a drone/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Drone Status"));

    // Both the count and the prompt should be hidden after collapse
    expect(screen.queryByText(/active drone/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select a drone/)).not.toBeInTheDocument();
  });

  it("re-expands after being collapsed", () => {
    render(<DroneStatusPanel />);
    const header = screen.getByText("Drone Status");
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.getByText(/Select a drone/)).toBeInTheDocument();
  });
});
