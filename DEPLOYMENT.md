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

### 3. Access Your Site

After deployment completes, your site will be available at:
- **URL**: `https://goodfront.github.io/memory-box/`

## Build Configuration

The app is configured for static export with the following settings in `next.config.ts`:

- `output: 'export'` - Generates static HTML/CSS/JS files
- `basePath: '/memory-box'` - Ensures all links work correctly on GitHub Pages
- `images.unoptimized: true` - Required for static export

## Local Testing

To test the production build locally:

```bash
cd memory-box-next-app
npm run build
npx serve out -p 3000
```

Then visit `http://localhost:3000/memory-box/` to see the production build.

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

### Links not working

If internal links don't work, ensure the `basePath` in `next.config.ts` matches your repository name.

### Service Worker issues

The PWA service worker is configured with the correct scope (`/memory-box/`). If you encounter caching issues:
1. Clear your browser cache
2. Unregister the service worker in DevTools
3. Hard refresh the page

### Build fails

Check the Actions tab for detailed error logs. Common issues:
- TypeScript errors
- Missing dependencies
- ESLint warnings (configured to fail on warnings)
