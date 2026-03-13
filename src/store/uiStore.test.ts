import { useUiStore } from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    useUiStore.setState({ connected: false, showRangeMarkers: false, showCameraArcs: false });
  });

  it("starts disconnected", () => {
    expect(useUiStore.getState().connected).toBe(false);
  });

  it("setConnected(true) marks as connected", () => {
    useUiStore.getState().setConnected(true);
    expect(useUiStore.getState().connected).toBe(true);
  });

  it("setConnected(false) marks as disconnected", () => {
    useUiStore.setState({ connected: true });
    useUiStore.getState().setConnected(false);
    expect(useUiStore.getState().connected).toBe(false);
  });

  it("setShowCameraArcs(true) enables camera arcs", () => {
    useUiStore.getState().setShowCameraArcs(true);
    expect(useUiStore.getState().showCameraArcs).toBe(true);
  });

  it("setShowCameraArcs(false) disables camera arcs", () => {
    useUiStore.setState({ showCameraArcs: true });
    useUiStore.getState().setShowCameraArcs(false);
    expect(useUiStore.getState().showCameraArcs).toBe(false);
  });
});
