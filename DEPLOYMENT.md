# GitHub Pages Deployment

This project is configured to automatically deploy to GitHub Pages.

## Setup

### 1. Enable GitHub Pages

1. Go to your repository settings: `https://github.com/goodfront/memory-box/settings/pages`
2. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
3. Save the settings

### 2. Deploy

The deployment happens automatically:
- Every push to the `main` branch triggers a build and deployment
- You can also manually trigger deployment from the Actions tab

### 3. Configure Custom Domain (Optional)

If using a custom domain:

1. Go to repository settings: `https://github.com/goodfront/memory-box/settings/pages`
2. Under "Custom domain":
   - Enter your domain: `memorybox.abefawson.com`
   - Click "Save"
   - Wait for DNS check to complete
3. Enable "Enforce HTTPS" once DNS propagates

The CNAME file is already configured in the repository.

### 4. Access Your Site

After deployment completes, your site will be available at:
- **Custom Domain**: `https://memorybox.abefawson.com/`
- **GitHub Pages URL**: `https://goodfront.github.io/memory-box/` (fallback)

## Build Configuration

The app is configured for static export with the following settings in `next.config.ts`:

- `output: 'export'` - Generates static HTML/CSS/JS files
- `images.unoptimized: true` - Required for static export

### Custom Domain

The app is configured to use the custom domain `memorybox.abefawson.com`. The CNAME file in the `public` directory ensures GitHub Pages serves the site at this domain.

## Local Testing

To test the production build locally:

```bash
cd memory-box-next-app
npm run build
npx serve out -p 3000
```

Then visit `http://localhost:3000/` to see the production build.

## Workflow Details

The GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. Checks out the code
2. Sets up Node.js
3. Installs dependencies
4. Builds the Next.js app with `npm run build`
5. Adds a `.nojekyll` file (prevents Jekyll processing)
6. Uploads the build artifact
7. Deploys to GitHub Pages

## Troubleshooting

### Custom domain not working

If your custom domain doesn't work:
1. Verify DNS records are configured correctly (CNAME pointing to `goodfront.github.io`)
2. Check the CNAME file exists in the repository at `memory-box-next-app/public/CNAME`
3. Wait for DNS propagation (can take up to 24 hours)

### Service Worker issues

The PWA service worker is configured with the correct scope (`/`). If you encounter caching issues:
1. Clear your browser cache
2. Unregister the service worker in DevTools
3. Hard refresh the page

### Build fails

Check the Actions tab for detailed error logs. Common issues:
- TypeScript errors
- Missing dependencies
- ESLint warnings (configured to fail on warnings)
