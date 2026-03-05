import { useEffect } from "react";
import LeftSidebar from "./features/layout/LeftSidebar";
import RightRail from "./features/layout/RightRail";
import MapContainer from "./features/map/MapContainer";
import { useDroneWebSocket } from "./hooks/useDroneWebSocket";
import { useFlightStore } from "./store/flightStore";

function App(): JSX.Element {
  useDroneWebSocket();

  const seedApprovals = useFlightStore((state) => state.seedApprovals);

  useEffect(() => {
    seedApprovals([
      {
        id: "860404",
        aircraftId: "B8994E",
        status: "approved",
        startedAt: new Date().toISOString(),
        planStartedAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        comments: "None"
      }
    ]);
  }, [seedApprovals]);

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0c1016] text-slate-100">
      <div className="flex h-full flex-col lg:flex-row">
        <LeftSidebar />
        <main className="relative min-h-[52vh] min-w-0 flex-1 lg:min-h-0">
          <MapContainer />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(30,201,255,0.1),transparent_45%)]" />
        </main>
        <RightRail />
      </div>
    </div>
  );
}

export default App;
