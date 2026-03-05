# Deployment Guide

## Deploying to Netlify

This project is configured for easy deployment to Netlify. Follow these steps:

### Option 1: Deploy via Netlify UI (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/drone-detector.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Netlify will auto-detect the build settings from `netlify.toml`
   - Click "Deploy site"

3. **Custom Domain (Optional)**
   - Go to Site settings → Domain management
   - Add your custom domain or use the provided netlify.app subdomain

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**
   ```bash
   netlify init
   netlify deploy --prod
   ```

### Build Configuration

The project uses the following build settings (defined in `netlify.toml`):

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20

### Environment Variables

Currently, this project runs with a mock WebSocket simulator for demonstration. If you want to connect to a real backend later:

1. Go to Site settings → Environment variables
2. Add your variables (e.g., `VITE_WS_URL`)
3. Update your code to use `import.meta.env.VITE_WS_URL`
4. Redeploy

### Verification

After deployment, test these features:
- ✅ Map loads correctly
- ✅ Mock drone data appears
- ✅ Sidebar panels work
- ✅ No console errors

### Showcase Tips

To make this project stand out on your GitHub profile:

1. **Add a live demo badge to README**
   ```markdown
   [![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)
   ```

2. **Add screenshots** in your README
3. **Include the live demo link** at the top of your README
4. **Pin this repository** on your GitHub profile

### Troubleshooting

**Build fails:** Ensure all dependencies are in `package.json`, not just in dev mode.

**Blank page:** Check browser console for errors. May need to update base path in `vite.config.ts`.

**404 errors:** The `netlify.toml` includes SPA redirect rules. Make sure the file is committed.

## Alternative Platforms

This Vite/React app can also be deployed to:
- **Vercel**: Similar process, auto-detects Vite
- **GitHub Pages**: Requires additional config for SPA routing
- **Cloudflare Pages**: Great performance, similar to Netlify
