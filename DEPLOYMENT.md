# Deployment Guide

## Target Platform

This app is set up for static deployment on Netlify.

It is a Vite + React single-page application, so deployment is straightforward:

- Build the app with `npm run build`
- Publish the generated `dist/` directory
- Redirect all routes to `index.html` for SPA routing

Those settings already exist in `netlify.toml`.

## Prerequisites

- Node.js 20
- npm
- A Netlify account
- A Git repository connected to GitHub, GitLab, or Bitbucket if you want automatic deploys

## Local Verification Before Deploying

Run the same checks locally before pushing a deployment:

```bash
npm install
npm test
npm run build
```

If the production build succeeds, Vite will output the static site into `dist/`.

## Environment Variables

The app currently supports these client-side environment variables:

```bash
VITE_WS_MODE=mock
VITE_WS_URL=ws://localhost:8080
```

### Recommended Netlify setup

For the current demo deployment, keep the app in mock mode:

```bash
VITE_WS_MODE=mock
```

`VITE_WS_URL` is only needed when wiring the UI to a real WebSocket backend.

### Important notes

- Only variables prefixed with `VITE_` are exposed to the browser.
- Changing environment variables requires a rebuild and redeploy.
- Do not put secrets in `VITE_` variables because they are bundled into client code.

## Netlify Configuration In This Repo

This repository already defines Netlify behavior in `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`
- SPA redirect: `/* -> /index.html` with status `200`
- Security headers on all routes
- Long-term caching for built assets under `/assets/*`

In most cases, you should let Netlify use the file as-is rather than manually overriding settings in the UI.

## Deploy Via Netlify UI

1. Push the repository to your Git provider.
2. In Netlify, choose `Add new site` and import the repository.
3. Confirm that Netlify picks up `netlify.toml`.
4. In Site configuration, add any required environment variables.
5. Start the first deploy.

### Recommended build settings

If Netlify asks for values explicitly, use:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

## Deploy Via Netlify CLI

Install the CLI if needed:

```bash
npm install -g netlify-cli
```

Authenticate:

```bash
netlify login
```

Create or link the site:

```bash
netlify init
```

Deploy a preview build:

```bash
netlify deploy
```

Deploy to production:

```bash
netlify deploy --prod
```

## Post-Deployment Smoke Test

After deployment, verify the following in the browser:

- The app shell loads without a blank screen
- The OpenLayers map renders correctly
- Drone and tower mock data appear and continue updating
- Right-rail panels expand and collapse correctly
- Refreshing a deep link does not return a `404`
- Browser console shows no runtime errors related to assets or environment configuration

## Existing Live Deployment

The README currently points to this live site:

- `https://dronedetect.netlify.app/`

If you are replacing that site, confirm that the new Netlify project uses the same environment values and domain configuration before switching traffic.

## Troubleshooting

### Build fails on Netlify

Check the following first:

- Netlify is using Node 20
- The install step completed successfully
- `npm run build` works locally
- No required `VITE_` environment variables are missing

### Site loads but shows a blank page

Usually this means one of the following:

- A runtime error occurred in the browser
- A built asset failed to load
- An environment variable is missing or invalid

Open the browser dev tools and inspect the console and network tabs.

### Refreshing a route returns `404`

This app needs SPA fallback routing. Ensure `netlify.toml` is present in the deployed branch and that the redirect rule is being applied.

### Real backend does not connect

If you switch away from mock mode:

- Set `VITE_WS_MODE` appropriately
- Set `VITE_WS_URL` to the correct WebSocket endpoint
- Confirm the backend supports `wss://` in production when the site is served over HTTPS
- Check browser console errors for mixed-content or connection failures

## Deployment Checklist

- Tests pass locally
- Production build passes locally
- `netlify.toml` is committed
- Required `VITE_` variables are configured in Netlify
- Production deploy completes successfully
- Smoke test passes on the live URL
