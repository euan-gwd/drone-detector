import {
  droneStatusColor,
  flightApprovalStatusColor,
  notificationLevelClass,
} from "./statusColors";

describe("droneStatusColor", () => {
  it("returns amber for warning", () => {
    expect(droneStatusColor("warning")).toBe("text-amber-300");
  });

  it("returns slate for offline", () => {
    expect(droneStatusColor("offline")).toBe("text-slate-300");
  });

  it("returns success for online", () => {
    expect(droneStatusColor("online")).toBe("text-success");
  });
});

describe("flightApprovalStatusColor", () => {
  it("returns success for approved", () => {
    expect(flightApprovalStatusColor("approved")).toBe("text-success");
  });

  it("returns amber for pending", () => {
    expect(flightApprovalStatusColor("pending")).toBe("text-amber-300");
  });

  it("returns rose for actionrequired", () => {
    expect(flightApprovalStatusColor("actionrequired")).toBe("text-rose-300");
  });

  it("returns slate for rejected", () => {
    expect(flightApprovalStatusColor("rejected")).toBe("text-slate-400");
  });
});

describe("notificationLevelClass", () => {
  it("returns amber for warning", () => {
    expect(notificationLevelClass("warning")).toBe("text-amber-300");
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
