import { render, screen, fireEvent } from "@testing-library/react";
import DronePopup from "./DronePopup";
import type { Drone } from "../../types/drone";

// ── Helpers ────────────────────────────────────────────────────────────────

const makeDrone = (overrides?: Partial<Drone>): Drone => ({
  id: "drn-101",
  name: "Test Drone",
  lat: 51.5,
  lon: -1.2,
  altitudeM: 120,
  speedMps: 7,
  headingDeg: 90,
  updatedAt: new Date().toISOString(),
  status: "online",
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("DronePopup", () => {
  it("renders the drone name in the header", () => {
    render(<DronePopup drone={makeDrone({ name: "Sky Eye" })} onClose={() => {}} />);
    expect(screen.getByText("Sky Eye")).toBeInTheDocument();
  });

  it("renders all telemetry fields", () => {
    render(
      <DronePopup
        drone={makeDrone({
          id: "drn-007",
          speedMps: 9,
          altitudeM: 150,
          headingDeg: 270,
        })}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("drn-007")).toBeInTheDocument();
    expect(screen.getByText("9 m/s")).toBeInTheDocument();
    expect(screen.getByText("150 m")).toBeInTheDocument();
    expect(screen.getByText("270°")).toBeInTheDocument();
  });

  it("capitalises the status label", () => {
    render(<DronePopup drone={makeDrone({ status: "warning" })} onClose={() => {}} />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("renders 'Online' for an online drone", () => {
    render(<DronePopup drone={makeDrone({ status: "online" })} onClose={() => {}} />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("renders 'Offline' for an offline drone", () => {
    render(<DronePopup drone={makeDrone({ status: "offline" })} onClose={() => {}} />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("renders 'Ready' for an offline drone when approval is approved", () => {
    render(<DronePopup drone={makeDrone({ status: "offline" })} approvalStatus="approved" onClose={() => {}} />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("renders 'Ready' for an offline drone when approval is pending", () => {
    render(<DronePopup drone={makeDrone({ status: "offline" })} approvalStatus="pending" onClose={() => {}} />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("renders 'Ready' for an offline drone when approval is actionrequired", () => {
    render(<DronePopup drone={makeDrone({ status: "offline" })} approvalStatus="actionrequired" onClose={() => {}} />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("calls onClose when the X button is clicked", () => {
    const handleClose = vi.fn();
    render(<DronePopup drone={makeDrone()} onClose={handleClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close drone popup/i }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders the close button with an accessible label", () => {
    render(<DronePopup drone={makeDrone()} onClose={() => {}} />);
    expect(screen.getByRole("button", { name: /close drone popup/i })).toBeInTheDocument();
  });

  it("applies the yellow colour class for warning status", () => {
    render(<DronePopup drone={makeDrone({ status: "warning" })} onClose={() => {}} />);
    // The status span should carry the yellow colour class
    const statusEl = screen.getByText("Warning");
    expect(statusEl.className).toContain("yellow");
  });

  it("applies the white colour class for offline status", () => {
    render(<DronePopup drone={makeDrone({ status: "offline" })} onClose={() => {}} />);
    const statusEl = screen.getByText("Offline");
    expect(statusEl.className).toContain("white");
  });

  it("applies the slate colour class for ready status when approval is pending", () => {
    render(<DronePopup drone={makeDrone({ status: "offline" })} approvalStatus="pending" onClose={() => {}} />);
    const statusEl = screen.getByText("Ready");
    expect(statusEl.className).toContain("slate-200");
  });

  it("does not call onClose when telemetry rows are clicked", () => {
    const handleClose = vi.fn();
    render(<DronePopup drone={makeDrone({ id: "drn-101" })} onClose={handleClose} />);

    fireEvent.click(screen.getByText("drn-101"));

    expect(handleClose).not.toHaveBeenCalled();
  });
});
