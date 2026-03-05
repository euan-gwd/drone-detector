# Drone Detector

> 🚁 Real-time drone tracking and flight management dashboard

Drone Detector is a modern React 19 dashboard app that renders a live drone operations view using OpenLayers for mapping, Tailwind CSS for styling, and a WebSocket-style real-time data flow.

**[Live Demo →](#)**

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
- Right status rail with:
	- Flight plan approval card
	- Drone status details
	- Notification feed
- Per-drone flight workflow controls
- Connection state indicator

## Flight Workflow (Per Drone)


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
Flight actions are tied to the currently selected drone on the map.

1. Select a drone marker.
2. If plan status is `pending` or `actionrequired`, primary action is `Request approval`.
3. After approval, status becomes `approved` and controls allow `Takeoff`/`Land`.
4. You can cycle `Takeoff` and `Land` as many times as needed while plan remains approved.
5. `End plan` resets status back to `pending` (must be landed first).

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