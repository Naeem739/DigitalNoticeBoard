import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  
  // Output configuration for Vercel - remove standalone for now
  // output: 'standalone',
  
  // Fix for DOMMatrix SSR error
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic modules from server-side rendering
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }
    
    // Handle PDF.js worker
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    return config;
  },
  
  // Disable static optimization for pages with browser-only dependencies
  // experimental: {
  //   missingSuspenseWithCSRBailout: false,
  // },
  
  // Ensure proper transpilation
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
  
  // Generate standalone output for production
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
  }),
};

export default nextConfig;