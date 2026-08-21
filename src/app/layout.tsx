import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";
import FaviconHandler from "./FaviconHandler";
import "../index.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kabinda Lodge - Premium Hospitality Experience",
  description: "Experience luxury and comfort at Kabinda Lodge - Your premier destination for exceptional hospitality",
  authors: [{ name: "Kabinda Lodge" }],
  keywords: ["hotel", "lodge", "hospitality", "luxury", "accommodation"],
  openGraph: {
    type: "website",
    title: "Kabinda Lodge - Premium Hospitality Experience",
    description: "Experience luxury and comfort at Kabinda Lodge - Your premier destination for exceptional hospitality",
    images: [
      {
        url: "https://storage.googleapis.com/gpt-engineer-file-uploads/sXgVQ3xRCPXR9l9e2ukGDGPK6wj2/social-images/social-1764547715449-Screenshot 2025-12-01 at 2.08.17 AM.png",
        width: 1200,
        height: 630,
        alt: "Kabinda Lodge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lovable_dev",
    title: "Kabinda Lodge - Premium Hospitality Experience",
    description: "Experience luxury and comfort at Kabinda Lodge - Your premier destination for exceptional hospitality",
    images: [
      "https://storage.googleapis.com/gpt-engineer-file-uploads/sXgVQ3xRCPXR9l9e2ukGDGPK6wj2/social-images/social-1764547715449-Screenshot 2025-12-01 at 2.08.17 AM.png",
    ],
  },
  verification: {
    google: "Yja-k2_oOYewVdcYoi96DhBnubuu7NVMu2gYpX4Sn-Y",
  },
  icons: {
    icon: [
      {
        url: "https://storage.googleapis.com/gpt-engineer-file-uploads/sXgVQ3xRCPXR9l9e2ukGDGPK6wj2/uploads/1764492094086-Favicon.png",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "https://storage.googleapis.com/gpt-engineer-file-uploads/sXgVQ3xRCPXR9l9e2ukGDGPK6wj2/uploads/1764492094086-Favicon.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Prevent ethereum property redefinition errors from browser extensions */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;

                // After a deploy, cached HTML can request deleted JS chunks.
                // Force a one-time hard reload so the user recovers automatically.
                function isChunkLoadError(message, error) {
                  var text = String(message || (error && error.message) || error || '');
                  return (
                    text.indexOf('ChunkLoadError') !== -1 ||
                    text.indexOf('Loading chunk') !== -1 ||
                    text.indexOf('Failed to fetch dynamically imported module') !== -1 ||
                    text.indexOf('error loading dynamically imported module') !== -1
                  );
                }

                function reloadOnceForChunkError() {
                  try {
                    var key = 'kabinda_chunk_reload';
                    if (sessionStorage.getItem(key) === '1') return;
                    sessionStorage.setItem(key, '1');
                    window.location.reload();
                  } catch (_) {}
                }

                var originalErrorHandler = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  if (typeof message === 'string' && message.indexOf('Cannot redefine property: ethereum') !== -1) {
                    console.warn('Suppressed ethereum redefinition error from browser extension');
                    return true;
                  }
                  if (isChunkLoadError(message, error)) {
                    reloadOnceForChunkError();
                    return true;
                  }
                  if (originalErrorHandler) {
                    return originalErrorHandler.call(this, message, source, lineno, colno, error);
                  }
                  return false;
                };

                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event && event.reason;
                  var msg = reason && (reason.message || reason);
                  if (msg && String(msg).indexOf('Cannot redefine property: ethereum') !== -1) {
                    console.warn('Suppressed ethereum redefinition promise rejection');
                    event.preventDefault();
                    return;
                  }
                  if (isChunkLoadError(msg, reason)) {
                    event.preventDefault();
                    reloadOnceForChunkError();
                  }
                });
              })();
            `,
          }}
        />
        <script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js"
          async
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          <FaviconHandler />
          {children}
          <Analytics />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

