import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: false,
    // Don't skip waiting - activate immediately
    skipWaiting: true,
    clientsClaim: true,
    // Include HTML pages in the precache manifest
    additionalManifestEntries: [
      { url: "/", revision: null },
      { url: "/box", revision: null },
      { url: "/box.html", revision: null },
      { url: "/cards", revision: null },
      { url: "/cards.html", revision: null },
      { url: "/cards/new", revision: null },
      { url: "/cards/new.html", revision: null },
      { url: "/cards/edit", revision: null },
      { url: "/cards/edit.html", revision: null },
      { url: "/cards/view", revision: null },
      { url: "/cards/view.html", revision: null },
      { url: "/review", revision: null },
      { url: "/review.html", revision: null },
      { url: "/offline", revision: null },
      { url: "/offline.html", revision: null },
    ],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-font-assets",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-image-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /\/_next\/static.+\.js$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-js-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\.(?:js)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-js-assets",
          expiration: {
            maxEntries: 48,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-style-assets",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        // Cache HTML pages - CacheFirst for instant offline loading
        // Since all data comes from IndexedDB, cached HTML is always valid
        urlPattern: ({ url, sameOrigin, request }) => {
          return (
            sameOrigin &&
            !url.pathname.startsWith("/api/") &&
            request.destination === "document"
          );
        },
        handler: "CacheFirst",
        options: {
          cacheName: "pages-html",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          // Update cache in background when online for freshness
          plugins: [
            {
              // When fetching from cache, try without query params if not found
              cachedResponseWillBeUsed: async ({ cacheName, request, cachedResponse }) => {
                // If we found a cached response, return it
                if (cachedResponse) {
                  return cachedResponse;
                }

                // If not found and URL has query params, try without them
                const url = new URL(request.url);
                if (url.search) {
                  const cache = await caches.open(cacheName);
                  // Try base path
                  let response = await cache.match(url.pathname);
                  if (!response) {
                    // Try with .html extension
                    response = await cache.match(`${url.pathname}.html`);
                  }
                  if (response) {
                    return response;
                  }
                }

                return null;
              }
            }
          ]
        },
      },
      {
        // Cache RSC (React Server Components) payloads for client-side navigation
        // Use CacheFirst for instant offline navigation
        urlPattern: ({ url, sameOrigin, request }) => {
          return (
            sameOrigin &&
            !url.pathname.startsWith("/api/") &&
            (request.headers.get("RSC") === "1" ||
             request.headers.get("Next-Router-State-Tree") !== null ||
             url.searchParams.has("_rsc"))
          );
        },
        handler: "CacheFirst",
        options: {
          cacheName: "pages-rsc",
          expiration: {
            maxEntries: 100, // Increased to cache more card views
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        // Catch-all for same-origin requests (images, etc)
        urlPattern: ({ url, sameOrigin }) => {
          return sameOrigin && !url.pathname.startsWith("/api/");
        },
        handler: "CacheFirst",
        options: {
          cacheName: "pages-other",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/memory-box' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/memory-box' : '',
  images: {
    unoptimized: true, // Required for static export
  },
  turbopack: {}, // Silence Turbopack warning for PWA webpack config
};

export default withPWA(nextConfig);
