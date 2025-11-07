import type { Metadata, Viewport } from "next";
import { DatabaseProvider, ServiceWorkerProvider } from "@/components/providers";
import { Header, Footer } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memory Box",
  description: "Memorize quotations using spaced repetition",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Memory Box",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex min-h-screen flex-col">
        <DatabaseProvider>
          <ServiceWorkerProvider />
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </DatabaseProvider>
      </body>
    </html>
  );
}
