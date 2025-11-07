import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
    // Don't skip waiting - activate immediately
    skipWaiting: true,
    clientsClaim: true,
    // Include HTML pages in the precache manifest
    additionalManifestEntries: [
      { url: "/", revision: null },
      { url: "/box", revision: null },
      { url: "/cards", revision: null },
      { url: "/cards/new", revision: null },
      { url: "/review", revision: null },
      { url: "/offline", revision: null },
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
        // Cache HTML pages - try network with fast fallback to cache
        urlPattern: ({ url, sameOrigin, request }) => {
          return (
            sameOrigin &&
            !url.pathname.startsWith("/api/") &&
            request.destination === "document"
          );
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-html",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          networkTimeoutSeconds: 2, // Fast fallback to cache
        },
      },
      {
        // Cache RSC (React Server Components) payloads for client-side navigation
        urlPattern: ({ url, sameOrigin, request }) => {
          return (
            sameOrigin &&
            !url.pathname.startsWith("/api/") &&
            (request.headers.get("RSC") === "1" ||
             request.headers.get("Next-Router-State-Tree") !== null ||
             url.searchParams.has("_rsc"))
          );
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-rsc",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          networkTimeoutSeconds: 2,
        },
      },
      {
        // Catch-all for same-origin requests (images, etc)
        urlPattern: ({ url, sameOrigin }) => {
          return sameOrigin && !url.pathname.startsWith("/api/");
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-other",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          networkTimeoutSeconds: 2,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'export',
  turbopack: {}, // Silence Turbopack warning for PWA webpack config
};

export default withPWA(nextConfig);
