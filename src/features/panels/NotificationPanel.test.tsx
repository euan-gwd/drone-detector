import { render, screen, fireEvent } from "@testing-library/react";
import NotificationPanel from "./NotificationPanel";
import { useNotificationStore } from "../../store/notificationStore";
import type { NotificationItem } from "../../types/drone";

const makeItem = (id: string, overrides?: Partial<NotificationItem>): NotificationItem => ({
  id,
  level: "info",
  title: "Test Notification",
  message: "A test message",
  createdAt: new Date("2025-01-01T12:00:00.000Z").toISOString(),
  ...overrides,
});

describe("NotificationPanel", () => {
  beforeEach(() => {
    useNotificationStore.setState({ items: [] });
  });

  it("renders the panel header", () => {
    render(<NotificationPanel />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("shows empty state when there are no notifications", () => {
    render(<NotificationPanel />);
    expect(screen.getByText("No alerts yet.")).toBeInTheDocument();
  });

  it("renders notification items", () => {
    useNotificationStore.setState({ items: [makeItem("n1", { title: "Alert One" })] });
    render(<NotificationPanel />);
    expect(screen.getByText("Alert One")).toBeInTheDocument();
  });

  it("displays the notification count in the header", () => {
    useNotificationStore.setState({ items: [makeItem("n1"), makeItem("n2")] });
    render(<NotificationPanel />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("dismisses a notification when the dismiss button is clicked", () => {
    useNotificationStore.setState({ items: [makeItem("n1", { title: "Dismiss Me" })] });
    render(<NotificationPanel />);
    fireEvent.click(screen.getByLabelText("Dismiss notification"));
    expect(useNotificationStore.getState().items).toHaveLength(0);
  });

  it("collapses the panel when the header button is clicked", () => {
    useNotificationStore.setState({ items: [makeItem("n1", { title: "Visible Item" })] });
    render(<NotificationPanel />);
    expect(screen.getByText("Visible Item")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Notifications"));
    expect(screen.queryByText("Visible Item")).not.toBeInTheDocument();
  });

  it("re-expands the panel after being collapsed", () => {
    render(<NotificationPanel />);
    const header = screen.getByText("Notifications");
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.getByText("No alerts yet.")).toBeInTheDocument();
  });

  it("highlights the drone name when droneName and droneId are provided", () => {
    useNotificationStore.setState({
      items: [
        makeItem("n1", {
          droneName: "North Watcher",
          droneId: "drn-102",
          message: "entered the warning zone",
        }),
      ],
    });
    render(<NotificationPanel />);
    expect(screen.getByText("North Watcher")).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveTextContent("drn-102");
  });

  it("renders a plain message when no droneName or droneId is provided", () => {
    useNotificationStore.setState({
      items: [makeItem("n1", { message: "System check complete" })],
    });
    render(<NotificationPanel />);
    expect(screen.getByText("System check complete")).toBeInTheDocument();
  });

  it("renders a timestamp for each notification", () => {
    useNotificationStore.setState({ items: [makeItem("n1")] });
    render(<NotificationPanel />);
    // toLocaleTimeString output varies by environment; just check something renders in the time zone
    const timeEl = screen.getByText(/\d{1,2}:\d{2}/);
    expect(timeEl).toBeInTheDocument();
  });
});
