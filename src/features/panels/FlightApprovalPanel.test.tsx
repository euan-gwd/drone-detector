import { render, screen, fireEvent } from "@testing-library/react";
import FlightApprovalPanel from "./FlightApprovalPanel";
import { useDroneStore } from "../../store/droneStore";
import { useFlightStore } from "../../store/flightStore";
import { useNotificationStore } from "../../store/notificationStore";
import type { Drone, FlightApproval } from "../../types/drone";

const makeDrone = (id: string, overrides?: Partial<Drone>): Drone => ({
  id,
  name: `Drone ${id}`,
  lat: 51.5,
  lon: -1.2,
  altitudeM: 100,
  speedMps: 10,
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

describe("FlightApprovalPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    useDroneStore.setState({ drones: {}, selectedDroneId: null, controlStatusByDrone: {} });
    useFlightStore.setState({ approvals: [], busyAction: null });
    useNotificationStore.setState({ items: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the Flight Plan Approvals header", () => {
    render(<FlightApprovalPanel />);
    expect(screen.getByText("Flight Plan Approvals")).toBeInTheDocument();
  });

  it("renders the Flight Approval(s) header", () => {
    render(<FlightApprovalPanel />);
    expect(screen.getByText("Flight Approval(s)")).toBeInTheDocument();
  });

  it("shows empty state when there are no flight plans", () => {
    render(<FlightApprovalPanel />);
    expect(screen.getByText("No active flight plans.")).toBeInTheDocument();
  });

  it("renders approval rows for each flight plan", () => {
    useFlightStore.setState({
      approvals: [
        makeApproval("drn-1", { id: "PLAN-001" }),
        makeApproval("drn-2", { id: "PLAN-002" }),
      ],
    });
    render(<FlightApprovalPanel />);
    expect(screen.getByText("PLAN-001")).toBeInTheDocument();
    expect(screen.getByText("PLAN-002")).toBeInTheDocument();
  });

  it("shows aircraft id and status in each approval row", () => {
    useFlightStore.setState({
      approvals: [makeApproval("drn-99", { status: "pending" })],
    });
    render(<FlightApprovalPanel />);
    expect(screen.getByText("drn-99")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("prompts to select a drone when none is selected", () => {
    render(<FlightApprovalPanel />);
    expect(screen.getByText(/Select a drone/)).toBeInTheDocument();
  });

  it("disables all action buttons when no drone is selected", () => {
    render(<FlightApprovalPanel />);
    // There are no action buttons at all when selectedDroneId is null; only the prompt renders
    expect(screen.queryByRole("button", { name: /request approval/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /end flight/i })).not.toBeInTheDocument();
  });

  it("shows 'Request Approval' when the plan is pending", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1") },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({
      approvals: [makeApproval("drn-1", { status: "pending" })],
    });
    render(<FlightApprovalPanel />);
    expect(screen.getByRole("button", { name: /request approval/i })).toBeInTheDocument();
  });

  it("shows 'Take Off' when the drone is landed and the plan is approved", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "offline" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1")] });
    render(<FlightApprovalPanel />);
    expect(screen.getByRole("button", { name: /take off/i })).not.toBeDisabled();
  });

  it("shows 'Land' when the drone is airborne and the plan is approved", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "online" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1")] });
    render(<FlightApprovalPanel />);
    expect(screen.getByRole("button", { name: /land/i })).not.toBeDisabled();
  });

  it("enables 'End Flight' when the drone is landed", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "offline" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1")] });
    render(<FlightApprovalPanel />);
    expect(screen.getByRole("button", { name: /end flight/i })).not.toBeDisabled();
  });

  it("shows 'Ready' flight status when drone is offline and approval is pending", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "offline" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1", { status: "pending" })] });
    render(<FlightApprovalPanel />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("shows 'Ready' flight status when drone is offline and approval is approved", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "offline" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1", { status: "approved" })] });
    render(<FlightApprovalPanel />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("shows 'Ready' flight status when drone is offline and approval is actionrequired", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "offline" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1", { status: "actionrequired" })] });
    render(<FlightApprovalPanel />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("disables 'End Flight' when the drone is still airborne", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "online" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({ approvals: [makeApproval("drn-1")] });
    render(<FlightApprovalPanel />);
    expect(screen.getByRole("button", { name: /end flight/i })).toBeDisabled();
  });

  it("disables action buttons while an action is busy", () => {
    useDroneStore.setState({
      drones: { "drn-1": makeDrone("drn-1", { status: "online" }) },
      selectedDroneId: "drn-1",
    });
    useFlightStore.setState({
      approvals: [makeApproval("drn-1")],
      busyAction: "land",
    });
    render(<FlightApprovalPanel />);
    screen
      .getAllByRole("button")
      .filter((b) => b.textContent !== "Flight Plan Approvals" && b.textContent !== "Flight Approval(s)")
      .forEach((btn) => expect(btn).toBeDisabled());
  });

  it("renders approval plan comments", () => {
    useFlightStore.setState({
      approvals: [makeApproval("drn-1", { comments: "Low altitude corridor" })],
    });
    render(<FlightApprovalPanel />);
    expect(screen.getByText("Low altitude corridor")).toBeInTheDocument();
  });

  it("collapsing the Plans section hides the approval rows", () => {
    useFlightStore.setState({ approvals: [makeApproval("drn-1", { id: "PLAN-X" })] });
    render(<FlightApprovalPanel />);
    fireEvent.click(screen.getByText("Flight Plan Approvals"));
    expect(screen.queryByText("PLAN-X")).not.toBeInTheDocument();
  });
});
