import {
  droneStatusColor,
  flightApprovalStatusColor,
  notificationLevelClass,
} from "./statusColors";

describe("droneStatusColor", () => {
  it("returns yellow for warning", () => {
    expect(droneStatusColor("warning")).toBe("text-yellow-300");
  });

  it("returns orange-400 when approval is pending", () => {
    expect(droneStatusColor("online", "pending")).toBe("text-orange-400");
  });

  it("returns white for offline", () => {
    expect(droneStatusColor("offline")).toBe("text-white");
  });

  it("returns slate-200 when offline approval is pending", () => {
    expect(droneStatusColor("offline", "pending")).toBe("text-slate-200");
  });

  it("returns rose for offline approval actionrequired", () => {
    expect(droneStatusColor("offline", "actionrequired")).toBe("text-rose-300");
  });

  it("returns sky for offline approval approved", () => {
    expect(droneStatusColor("offline", "approved")).toBe("text-sky-300");
  });

  it("returns success for online", () => {
    expect(droneStatusColor("online")).toBe("text-success");
  });
});

describe("flightApprovalStatusColor", () => {
  it("returns success for approved", () => {
    expect(flightApprovalStatusColor("approved")).toBe("text-success");
  });

  it("returns orange-400 for pending", () => {
    expect(flightApprovalStatusColor("pending")).toBe("text-orange-400");
  });

  it("returns rose for actionrequired", () => {
    expect(flightApprovalStatusColor("actionrequired")).toBe("text-rose-300");
  });

  it("returns slate for rejected", () => {
    expect(flightApprovalStatusColor("rejected")).toBe("text-slate-400");
  });
});

describe("notificationLevelClass", () => {
  it("returns yellow for warning", () => {
    expect(notificationLevelClass("warning")).toBe("text-yellow-300");
  });

  it("returns rose for error", () => {
    expect(notificationLevelClass("error")).toBe("text-rose-300");
  });

  it("returns emerald for success", () => {
    expect(notificationLevelClass("success")).toBe("text-emerald-300");
  });

  it("returns sky for info", () => {
    expect(notificationLevelClass("info")).toBe("text-sky-300");
  });
});
