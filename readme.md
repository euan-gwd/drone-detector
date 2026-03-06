# Drone Detector POC

> 🚁 Real-time drone tracking and flight management dashboard

Drone Detector is a modern React 19 dashboard app that renders a live drone operations view using OpenLayers for mapping, Tailwind CSS for styling, and a WebSocket-style real-time data flow.

**[Live Demo →](https://dronedetect.netlify.app/)**

## Stack

- React 19 + TypeScript
- Vite
- OpenLayers
- Zustand
- Tailwind CSS

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

## Current Features

- Left navigation shell
- Central dark OpenLayers map
- Live moving drone markers from mock socket stream
- Right status rail with four collapsible panels (each has a green header bar with chevron toggle):
	- **Drone Status** — shows a summary of active drones when no drone is selected; shows live telemetry (name, ID, speed, altitude, heading, status) for the selected drone
	- **Flight Plan Approvals** — always shows all flight plans as scrollable cards (plan ID, aircraft, status, start/end times, comments); not drone-specific
	- **Flight Approval(s)** — drone-specific; shows approval status, flight status, and action buttons for the selected drone
	- **Notifications** — collapsible feed with a live count badge in the header
- Per-drone flight workflow controls
- Connection state indicator

## Right Rail Panels

All four panels in the right rail share a consistent collapsible design — a dark green header bar with an icon, title, and a rotating chevron. Click the header to collapse or expand the panel.

### Drone Status

- **No drone selected**: displays the count of actively tracked drones and a prompt to select one.
- **Drone selected**: displays live telemetry — name, ID, speed (m/s), altitude (m), heading (°), and status (Online / Warning / Offline).

### Flight Plan Approvals

Always displays all active flight plans regardless of drone selection. Plans are listed as scrollable cards (constrained height, ~1.5 cards visible at a time). Each card shows:

- Flight Plan ID
- Aircraft ID
- Status (colour-coded)
- Plan start and end times
- Comments from the authority

### Flight Approval(s)

Drone-specific. Tracks the approval and flight lifecycle for the currently selected drone:

- Shows `Aircraft`, `Flight Approval Status`, `Flight Status`, and `Flight Started` time.
- **Request Approval** — available when status is `pending` or `actionrequired`.
- **Take Off / Land** — available after approval, toggles between airborne and landed state.
- **End Flight** — resets the approval record (drone must be landed).

### Notifications

Collapsible feed. The notification count is shown in the header when collapsed. Entries are colour-coded by severity (info, success, warning, error) and include a formatted message with drone name highlighted.

## Flight Workflow (Per Drone)

Flight actions are tied to the currently selected drone on the map.

1. Select a drone marker.
2. If plan status is `pending` or `actionrequired`, primary action is `Request Approval`.
3. After approval, status becomes `approved` and controls allow `Take Off` / `Land`.
4. You can cycle `Take Off` and `Land` as many times as needed while the plan remains approved.
5. `End Flight` resets the approval record (drone must be landed first).

## Deployment

This project is ready to deploy to Netlify, Vercel, or similar platforms.

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Build Configuration

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 20+

## Architecture

- **State Management**: Zustand stores for drones, flights, notifications, and UI
- **Real-time Updates**: Mock WebSocket simulator (can be replaced with real backend)
- **Mapping**: OpenLayers with custom drone markers and tracking
- **Styling**: Tailwind CSS with dark theme
- **Type Safety**: Full TypeScript coverage

## Approval Statuses

- `approved`: plan is valid and flight actions are allowed.
- `pending`: approval is required before flight.
- `actionrequired`: invalid action attempted (for example takeoff without approved plan).
- `rejected`: type is supported, currently not used by the mock workflow.

## Map And Status Color Rules

- Drone selection is shown with a larger marker outline.
- Plan status can override marker color:
	- `pending` -> orange marker
	- `actionrequired` -> red marker
- Default marker colors still follow drone status when no plan override applies.

## Landed State Persistence

- Control commands are persisted per drone (`zustand` persist middleware).
- `Land` forces drone to `offline` and freezes movement.
- While landed, incoming telemetry cannot change lat/lon and speed/altitude stay at `0`.
- `Takeoff` returns control state to active flight (`online`).
- Any `pending` plan starts in landed state.

## Environment

Copy `.env.example` values into `.env` as needed:

- `VITE_WS_MODE=mock`
- `VITE_WS_URL=ws://localhost:8080`

Current implementation uses a local simulator stream for fast UI development.

## Event Envelope (Proposed)

```ts
{
	version: 1,
	type: "drone.position" | "drone.status" | "notification.created" | "connection.state",
	timestamp: string,
	payload: object
}
```

## Layout Notes

- Desktop: left nav + center map + right rail
- Mobile/tablet: center map stacks above right rail

## Screenshot

![Drone Detector Dashboard](screenshot.png)
