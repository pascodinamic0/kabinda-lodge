const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use src directory structure
  // Next.js will automatically detect src/app
  images: {
    // domains is deprecated in Next.js 16, use remotePatterns only
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Note: src/page-components contains React components, not Next.js pages
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Set turbopack root to the project root directory
  // According to Next.js docs: root should be an absolute path
  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;

