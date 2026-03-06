import { useNotificationStore } from "./notificationStore";
import type { NotificationItem } from "../types/drone";

const makeItem = (id: string, overrides?: Partial<NotificationItem>): NotificationItem => ({
  id,
  level: "info",
  title: "Test notification",
  message: "A test message",
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("notificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({ items: [] });
  });

  it("starts empty", () => {
    expect(useNotificationStore.getState().items).toHaveLength(0);
  });

  it("adds a notification", () => {
    useNotificationStore.getState().addNotification(makeItem("n1"));
    expect(useNotificationStore.getState().items).toHaveLength(1);
    expect(useNotificationStore.getState().items[0].id).toBe("n1");
  });

  it("prepends new notifications so latest appears first", () => {
    useNotificationStore.getState().addNotification(makeItem("n1"));
    useNotificationStore.getState().addNotification(makeItem("n2"));
    expect(useNotificationStore.getState().items[0].id).toBe("n2");
  });

  it("caps the list at 30 items", () => {
    for (let i = 0; i < 35; i++) {
      useNotificationStore.getState().addNotification(makeItem(`n${i}`));
    }
    expect(useNotificationStore.getState().items).toHaveLength(30);
  });

  it("removes a notification by id", () => {
    useNotificationStore.getState().addNotification(makeItem("n1"));
    useNotificationStore.getState().addNotification(makeItem("n2"));
    useNotificationStore.getState().clearNotification("n1");
    const ids = useNotificationStore.getState().items.map((item) => item.id);
    expect(ids).not.toContain("n1");
    expect(ids).toContain("n2");
  });

  it("is a no-op when the id does not exist", () => {
    useNotificationStore.getState().addNotification(makeItem("n1"));
    useNotificationStore.getState().clearNotification("nonexistent");
    expect(useNotificationStore.getState().items).toHaveLength(1);
  });
});
