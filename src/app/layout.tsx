import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
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
                // Handle ethereum property conflicts from browser extensions
                if (typeof window !== 'undefined') {
                  // Add global error handler to suppress ethereum redefinition errors
                  const originalErrorHandler = window.onerror;
                  window.onerror = function(message, source, lineno, colno, error) {
                    // Suppress "Cannot redefine property: ethereum" errors from extensions
                    if (typeof message === 'string' && message.includes('Cannot redefine property: ethereum')) {
                      console.warn('Suppressed ethereum redefinition error from browser extension');
                      return true; // Suppress the error
                    }
                    // Call original error handler if it exists
                    if (originalErrorHandler) {
                      return originalErrorHandler.call(this, message, source, lineno, colno, error);
                    }
                    return false;
                  };
                  
                  // Also handle unhandled promise rejections
                  window.addEventListener('unhandledrejection', function(event) {
                    if (event.reason && typeof event.reason === 'object' && event.reason.message) {
                      if (event.reason.message.includes('Cannot redefine property: ethereum')) {
                        console.warn('Suppressed ethereum redefinition promise rejection');
                        event.preventDefault();
                      }
                    }
                  });
                }
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
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

