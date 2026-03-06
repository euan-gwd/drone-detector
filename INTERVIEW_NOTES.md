# Interview Notes — drone-detector

---

## 1. How is the Zustand store structured?

Four separate stores, each owning a distinct concern:

- **`droneStore`** — the source of truth for live drone objects (`Record<string, Drone>`), which drone is selected, and the operator override layer (`controlStatusByDrone`). Uses `persist` middleware so override commands survive a page refresh.
- **`flightStore`** — owns the `FlightApproval[]` array and all async flight actions (takeoff, land, request-approval). It deliberately calls `useDroneStore.getState()` to mutate the drone store — this is intentional cross-store coordination that works because Zustand stores are module singletons, not React context.
- **`notificationStore`** — an append-only message queue, capped at 30 items. Acts as a shared message bus; any store can push into it.
- **`uiStore`** — single boolean, `connected`, reflecting WebSocket connection state. Kept isolated so WebSocket lifecycle logic doesn't pollute domain state.

### Why Zustand specifically?

| Concern | Zustand's answer |
|---|---|
| **Boilerplate** | None — no reducers, action creators, or providers needed |
| **Subscriptions** | Components only re-render when the specific slice they select changes |
| **Cross-store access** | `.getState()` lets any store read or mutate another store imperatively, outside React |
| **Persistence** | The `persist` middleware wraps a store in one extra call |
| **React context** | No `<Provider>` wrapper required; stores are module-level singletons |

Redux would have been overkill for a 4-store POC. React Context + `useReducer` would re-render all consumers on every telemetry tick without careful manual splitting.

---

## 2. How does the WebSocket simulator feed data into state?

Three layers, each with a clear job:

**`mockWsSimulator.ts`** — pure data generation. `createMockEventBatch` takes the current drone array, applies small random `drift()` to lat/lon, nudges altitude, speed, and heading, then returns typed `DroneSocketEvent` objects. Every ~28% of ticks it also generates a notification event. No side effects — just a function that takes state in and returns events out.

**`DroneSocketClient`** (in `websocketClient.ts`) — the transport abstraction. It owns the `setInterval` (every 1200ms), maintains its own internal copy of drone positions to pass back into `createMockEventBatch` each tick, and manages a `Set` of subscriber handlers. Critically, it emits a `connection.state` event on `start()` and `stop()`, so the rest of the app doesn't need to know it's a mock. Swapping in a real WebSocket would only require changing this class.

**`useDroneWebSocket`** hook — the React integration layer. A single `useEffect` subscribes to the client, starts it, and returns a cleanup that unsubscribes and stops it. The `client` instance is declared at module scope (outside the hook), so it's a singleton — calling the hook from multiple components won't spawn multiple connections. Inside the subscription callback it routes by event type:
- `drone.position` → `upsertDrone`
- `drone.status` → `updateDroneStatus`
- `notification.created` → `addNotification`
- `connection.state` → `setConnected`

---

## 3. How does OpenLayers get initialised inside React?

The `useEffect` in `MapContainer.tsx` runs once after mount and guards itself with:

```ts
if (!mapRef.current || mapInstanceRef.current) return;
```

The first condition ensures the DOM node exists. The second prevents re-initialisation if the effect somehow re-runs.

Inside it builds the layer stack — a `TileLayer` (CartoCDN dark tiles via XYZ source) and a `VectorLayer` backed by `droneLayerSource`, which was created with `useMemo`. The `VectorSource` is memoised so it's stable across re-renders; this means the map init effect only runs once, and a second `useEffect` can mutate the same source instance on every telemetry update without touching the map init effect at all.

The click handler uses `map.forEachFeatureAtPixel` to hit-test against the vector layer, reads the `droneId` property off the feature, then calls `selectDrone` inside `startTransition` — marking it as a non-urgent update so React won't block map interaction while the sidebar re-renders.

The effect cleanup calls `map.setTarget(undefined)` — the correct OpenLayers way to dispose a map without leaking internal canvas listeners.

---

## 4. How does the flight state machine transition between statuses?

`runAction` in `flightStore` is the entry point. The logic flow:

1. Sets `busyAction` immediately (drives loading UI), then `await wait(900)` to simulate network latency.
2. Checks if an approval record exists for the drone — if not, creates a `pending` one and forces the drone `offline`.
3. **`request-approval`** — fast-tracks to `approved` and fires a success notification. In a real system this would be the async call to an ATC API.
4. **`takeoff` or `land` without an approved plan** — transitions to `actionrequired` and fires a warning notification. This is a guard state, not a permanent one — resolved by requesting approval.
5. **`land`** — calls `setControlStatus(droneId, "offline")`. This writes into `droneStore.controlStatusByDrone`, which `upsertDrone` checks on every incoming telemetry tick — overriding WebSocket data to freeze the drone in place.
6. **`takeoff`** — calls `setControlStatus(droneId, "online")`, releasing the override and letting live telemetry flow again.
7. **`end-plan`** — requires the drone to already be landed, then resets the approval back to `pending`.

The approval statuses form a one-way flow:

```
pending → approved → (actionrequired if bad action attempted)
approved → pending  (via end-plan, must be landed first)
```

The `controlStatusByDrone` override in `droneStore` is what links the flight decision back to the live map — the status the marker renders with is the controlled status, not the raw telemetry status.
